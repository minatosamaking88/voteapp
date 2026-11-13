import {
  FEATURE_DESCRIPTION_MAX_LENGTH,
  FEATURE_DESCRIPTION_MIN_LENGTH,
  FEATURE_TITLE_MAX_LENGTH,
  FEATURE_TITLE_MIN_LENGTH,
} from "@featurevote/shared/contracts";

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

type FeatureFieldErrors = Record<string, string[]>;

type FeatureFieldsProps = {
  title: string;
  description: string;
  fieldErrors: FeatureFieldErrors;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onFieldBlur: (field: "title" | "description", value: string) => void;
};

export function FeatureFields({
  title,
  description,
  fieldErrors,
  onTitleChange,
  onDescriptionChange,
  onFieldBlur,
}: FeatureFieldsProps) {
  return (
    <>
      <label className="form-field">
        <span>
          Title <span className="required-note">(required)</span>
        </span>
        <input
          name="title"
          value={title}
          minLength={FEATURE_TITLE_MIN_LENGTH}
          maxLength={FEATURE_TITLE_MAX_LENGTH}
          required
          aria-invalid={Boolean(fieldErrors.title?.length)}
          aria-describedby={
            fieldErrors.title?.length ? "title-error" : "title-hint"
          }
          onBlur={() => onFieldBlur("title", title)}
          onChange={(event) => onTitleChange(event.currentTarget.value)}
        />
        <span id="title-hint" className="field-hint">
          {FEATURE_TITLE_MIN_LENGTH}–{FEATURE_TITLE_MAX_LENGTH} characters after
          trimming.
        </span>
        {fieldErrors.title?.length ? (
          <span id="title-error" className="field-error">
            {fieldErrors.title.join(" ")}
          </span>
        ) : null}
      </label>
      <label className="form-field">
        <span>
          Description <span className="required-note">(required)</span>
        </span>
        <textarea
          name="description"
          value={description}
          minLength={FEATURE_DESCRIPTION_MIN_LENGTH}
          maxLength={FEATURE_DESCRIPTION_MAX_LENGTH}
          rows={6}
          required
          aria-invalid={Boolean(fieldErrors.description?.length)}
          aria-describedby={
            fieldErrors.description?.length
              ? "description-error"
              : "description-hint"
          }
          onBlur={() => onFieldBlur("description", description)}
          onChange={(event) => onDescriptionChange(event.currentTarget.value)}
        />
        <span id="description-hint" className="field-hint">
          {FEATURE_DESCRIPTION_MIN_LENGTH}–
          {numberFormatter.format(FEATURE_DESCRIPTION_MAX_LENGTH)} characters
          after trimming.
        </span>
        {fieldErrors.description?.length ? (
          <span id="description-error" className="field-error">
            {fieldErrors.description.join(" ")}
          </span>
        ) : null}
      </label>
    </>
  );
}
