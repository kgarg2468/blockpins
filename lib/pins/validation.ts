export const TITLE_MAX_LENGTH = 80;
export const NOTE_MAX_LENGTH = 280;

export type PinDraft = {
  title: string;
  note?: string;
};

export type PinValidationResult = {
  valid: boolean;
  errors: {
    title?: string;
    note?: string;
  };
};

export function validatePinDraft(input: PinDraft): PinValidationResult {
  const errors: PinValidationResult["errors"] = {};
  const trimmedTitle = input.title.trim();
  const noteValue = input.note ?? "";

  if (!trimmedTitle) {
    errors.title = "Title is required.";
  } else if (trimmedTitle.length > TITLE_MAX_LENGTH) {
    errors.title = `Title must be ${TITLE_MAX_LENGTH} characters or fewer.`;
  }

  if (noteValue.length > NOTE_MAX_LENGTH) {
    errors.note = `Note must be ${NOTE_MAX_LENGTH} characters or fewer.`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
