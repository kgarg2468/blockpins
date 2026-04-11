"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";

import { PinsMap } from "@/components/pins-map";
import { CHAPMAN_CENTER } from "@/lib/map/constants";
import { createPin, fetchPins } from "@/lib/pins/repository";
import { sortPinsNewestFirst } from "@/lib/pins/sort";
import { NOTE_MAX_LENGTH, TITLE_MAX_LENGTH, validatePinDraft } from "@/lib/pins/validation";
import { createPinAndRefetch } from "@/lib/pins/workflow";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Coordinates, Pin } from "@/types/pins";

type AuthMode = "signin" | "signup";

type PinFormState = {
  title: string;
  note: string;
};

// Visual thesis: blocky terrain palette, carved edges, and pixel-forward typography.
// Content plan: auth gate -> map workspace -> pin panel/list -> selected pin detail.
// Interaction thesis: staged page entry, sliding panel transitions, and marker/list highlighting.

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function formatCoordinates(coordinates: Coordinates): string {
  return `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

function PanelContent({
  pins,
  selectedPin,
  selectedPinId,
  pinsLoading,
  pinsError,
  draft,
  draftCoordinates,
  draftErrors,
  saveError,
  savePending,
  onDraftChange,
  onSelectPin,
  onSavePin,
  onCancelDraft,
}: {
  pins: Pin[];
  selectedPin: Pin | null;
  selectedPinId: string | null;
  pinsLoading: boolean;
  pinsError: string | null;
  draft: PinFormState;
  draftCoordinates: Coordinates | null;
  draftErrors: {
    title?: string;
    note?: string;
  };
  saveError: string | null;
  savePending: boolean;
  onDraftChange: (nextState: PinFormState) => void;
  onSelectPin: (pinId: string) => void;
  onSavePin: (event: FormEvent<HTMLFormElement>) => void;
  onCancelDraft: () => void;
}) {
  return (
    <div className="panel-content">
      <section className="panel-section">
        <h2>Drop a New Pin</h2>
        <p className="panel-helper">
          Click anywhere on the map to stage a pin around Chapman University.
        </p>

        {draftCoordinates ? (
          <form className="pin-form" onSubmit={onSavePin}>
            <p className="coord-chip">Lat/Lng: {formatCoordinates(draftCoordinates)}</p>
            <label className="input-label" htmlFor="pin-title">
              Title
            </label>
            <input
              id="pin-title"
              className={clsx("input-field", draftErrors.title && "has-error")}
              value={draft.title}
              onChange={(event) => {
                onDraftChange({ ...draft, title: event.target.value });
              }}
              maxLength={TITLE_MAX_LENGTH}
              placeholder="Ex: Favorite study bench"
            />
            {draftErrors.title ? <p className="input-error">{draftErrors.title}</p> : null}

            <label className="input-label" htmlFor="pin-note">
              Note
            </label>
            <textarea
              id="pin-note"
              className={clsx("input-field textarea-field", draftErrors.note && "has-error")}
              value={draft.note}
              onChange={(event) => {
                onDraftChange({ ...draft, note: event.target.value });
              }}
              maxLength={NOTE_MAX_LENGTH}
              placeholder="Optional note"
              rows={3}
            />
            {draftErrors.note ? <p className="input-error">{draftErrors.note}</p> : null}
            {saveError ? <p className="input-error">{saveError}</p> : null}

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={savePending}>
                {savePending ? "Saving..." : "Save Pin"}
              </button>
              <button type="button" className="btn-secondary" onClick={onCancelDraft}>
                Clear
              </button>
            </div>
          </form>
        ) : (
          <p className="empty-hint">No staged pin. Click the map to open the pin form.</p>
        )}
      </section>

      <section className="panel-section">
        <h2>Saved Pins</h2>
        {pinsLoading ? <p className="panel-helper">Loading pins...</p> : null}
        {pinsError ? <p className="input-error">{pinsError}</p> : null}

        {!pinsLoading && pins.length === 0 ? (
          <p className="empty-hint">Your pins will appear here after you save one.</p>
        ) : null}

        <ul className="pin-list">
          {pins.map((pin, index) => (
            <motion.li
              key={pin.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.03, 0.18), duration: 0.22 }}
            >
              <button
                type="button"
                className={clsx("pin-row", pin.id === selectedPinId && "is-selected")}
                onClick={() => onSelectPin(pin.id)}
              >
                <span className="pin-row-title">{pin.title}</span>
                <span className="pin-row-meta">{formatDate(pin.created_at)}</span>
              </button>
            </motion.li>
          ))}
        </ul>
      </section>

      {selectedPin ? (
        <section className="panel-section selected-detail">
          <h2>Selected Pin</h2>
          <p className="detail-title">{selectedPin.title}</p>
          <p className="detail-note">{selectedPin.note || "No note."}</p>
          <p className="detail-meta">Saved: {formatDate(selectedPin.created_at)}</p>
          <p className="detail-meta">
            Position: {formatCoordinates(selectedPin)}
          </p>
        </section>
      ) : null}
    </div>
  );
}

export default function Home() {
  const supabase = useMemo(() => getBrowserSupabaseClient(), []);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";

  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authPending, setAuthPending] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  const [pins, setPins] = useState<Pin[]>([]);
  const [pinsLoading, setPinsLoading] = useState(false);
  const [pinsError, setPinsError] = useState<string | null>(null);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [draftCoordinates, setDraftCoordinates] = useState<Coordinates | null>(null);
  const [draft, setDraft] = useState<PinFormState>({ title: "", note: "" });
  const [draftErrors, setDraftErrors] = useState<{ title?: string; note?: string }>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savePending, setSavePending] = useState(false);

  const [panelOpen, setPanelOpen] = useState(true);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }

      setSession(data.session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const loadPins = useCallback(
    async (userId: string) => {
      if (!supabase) {
        return;
      }

      setPinsLoading(true);
      setPinsError(null);

      try {
        const data = await fetchPins(supabase, userId);
        setPins(sortPinsNewestFirst(data));
      } catch (error) {
        setPinsError(toErrorMessage(error));
      } finally {
        setPinsLoading(false);
      }
    },
    [supabase],
  );

  useEffect(() => {
    if (!session) {
      setPins([]);
      setSelectedPinId(null);
      return;
    }

    void loadPins(session.user.id);
  }, [session, loadPins]);

  const sortedPins = useMemo(() => sortPinsNewestFirst(pins), [pins]);
  const selectedPin = useMemo(() => {
    return sortedPins.find((pin) => pin.id === selectedPinId) ?? null;
  }, [sortedPins, selectedPinId]);

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase) {
      setAuthError("Supabase is not configured.");
      return;
    }

    if (!email.includes("@")) {
      setAuthError("Enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }

    setAuthPending(true);
    setAuthError(null);
    setAuthInfo(null);

    try {
      if (authMode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        if (!data.session) {
          setAuthInfo("Account created. Confirm your email, then sign in.");
          setAuthMode("signin");
        }
      }
    } catch (error) {
      setAuthError(toErrorMessage(error));
    } finally {
      setAuthPending(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setPins([]);
    setDraft({ title: "", note: "" });
    setDraftCoordinates(null);
    setSelectedPinId(null);
  };

  const handleMapClick = useCallback((coordinates: Coordinates) => {
    setDraftCoordinates(coordinates);
    setDraftErrors({});
    setSaveError(null);
    setSelectedPinId(null);

    if (typeof window !== "undefined" && window.innerWidth < 980) {
      setMobilePanelOpen(true);
    } else {
      setPanelOpen(true);
    }
  }, []);

  const handleSelectPin = useCallback((pinId: string) => {
    setSelectedPinId(pinId);
    setDraftCoordinates(null);
  }, []);

  const handleSavePin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase || !session || !draftCoordinates) {
      return;
    }

    const validation = validatePinDraft(draft);
    if (!validation.valid) {
      setDraftErrors(validation.errors);
      return;
    }

    setDraftErrors({});
    setSaveError(null);
    setSavePending(true);

    try {
      const refreshedPins = await createPinAndRefetch(
        {
          createPin: (userId, input) => createPin(supabase, userId, input),
          fetchPins: (userId) => fetchPins(supabase, userId),
        },
        session.user.id,
        {
          title: draft.title,
          note: draft.note,
          latitude: draftCoordinates.latitude,
          longitude: draftCoordinates.longitude,
        },
      );

      const ordered = sortPinsNewestFirst(refreshedPins);
      setPins(ordered);
      setSelectedPinId(ordered[0]?.id ?? null);
      setDraft({ title: "", note: "" });
      setDraftCoordinates(null);
    } catch (error) {
      setSaveError(toErrorMessage(error));
    } finally {
      setSavePending(false);
    }
  };

  if (authLoading) {
    return (
      <div className="screen-loader">
        <p>Loading Chapman BlockPins...</p>
      </div>
    );
  }

  if (!supabase) {
    return (
      <div className="screen-loader is-error">
        <h1>Supabase Not Configured</h1>
        <p>Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to continue.</p>
      </div>
    );
  }

  if (!session) {
    return (
      <main className="auth-scene">
        <motion.section
          className="auth-panel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <p className="auth-brand">Chapman BlockPins</p>
          <h1>Save map notes where you stand.</h1>
          <p className="auth-subtitle">
            Personal pins around Chapman University. Email sign-in and instant persistence.
          </p>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@chapman.edu"
              autoComplete="email"
            />
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete={authMode === "signin" ? "current-password" : "new-password"}
            />

            {authError ? <p className="input-error">{authError}</p> : null}
            {authInfo ? <p className="auth-info">{authInfo}</p> : null}

            <button className="btn-primary auth-submit" disabled={authPending} type="submit">
              {authPending
                ? "Please wait..."
                : authMode === "signin"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>

          <button
            type="button"
            className="switch-auth"
            onClick={() => {
              setAuthMode((mode) => (mode === "signin" ? "signup" : "signin"));
              setAuthError(null);
              setAuthInfo(null);
            }}
          >
            {authMode === "signin"
              ? "Need an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </motion.section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <motion.header
        className="app-topbar"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <p className="topbar-brand">Chapman BlockPins</p>
          <p className="topbar-subtitle">
            Centered at {CHAPMAN_CENTER.latitude}, {CHAPMAN_CENTER.longitude}
          </p>
        </div>
        <div className="topbar-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setPanelOpen((open) => !open)}
          >
            {panelOpen ? "Hide Panel" : "Show Panel"}
          </button>
          <button type="button" className="btn-primary" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </motion.header>

      <section className="workspace">
        <motion.div
          className="map-shell"
          initial={{ opacity: 0.6, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.42, ease: "easeOut" }}
        >
          <PinsMap
            mapboxToken={mapboxToken}
            pins={sortedPins}
            selectedPinId={selectedPinId}
            onMapClick={handleMapClick}
            onSelectPin={handleSelectPin}
          />
        </motion.div>

        <AnimatePresence>
          {panelOpen ? (
            <motion.aside
              className="side-panel"
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 24, opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              <PanelContent
                pins={sortedPins}
                selectedPin={selectedPin}
                selectedPinId={selectedPinId}
                pinsLoading={pinsLoading}
                pinsError={pinsError}
                draft={draft}
                draftCoordinates={draftCoordinates}
                draftErrors={draftErrors}
                saveError={saveError}
                savePending={savePending}
                onDraftChange={setDraft}
                onSelectPin={handleSelectPin}
                onSavePin={handleSavePin}
                onCancelDraft={() => {
                  setDraftCoordinates(null);
                  setDraftErrors({});
                  setSaveError(null);
                }}
              />
            </motion.aside>
          ) : null}
        </AnimatePresence>
      </section>

      <button
        type="button"
        className="mobile-panel-toggle"
        onClick={() => setMobilePanelOpen((open) => !open)}
      >
        {mobilePanelOpen ? "Close Pins" : "Pins"}
      </button>

      <AnimatePresence>
        {mobilePanelOpen ? (
          <motion.div
            className="mobile-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobilePanelOpen(false)}
          >
            <motion.aside
              className="mobile-drawer"
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
            >
              <PanelContent
                pins={sortedPins}
                selectedPin={selectedPin}
                selectedPinId={selectedPinId}
                pinsLoading={pinsLoading}
                pinsError={pinsError}
                draft={draft}
                draftCoordinates={draftCoordinates}
                draftErrors={draftErrors}
                saveError={saveError}
                savePending={savePending}
                onDraftChange={setDraft}
                onSelectPin={handleSelectPin}
                onSavePin={handleSavePin}
                onCancelDraft={() => {
                  setDraftCoordinates(null);
                  setDraftErrors({});
                  setSaveError(null);
                }}
              />
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
