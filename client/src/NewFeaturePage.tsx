import { FeatureFields } from "./FeatureFields";
import { useNewFeature } from "./use-new-feature";

export function NewFeaturePage() {
  const {
    title,
    description,
    fieldErrors,
    error,
    saving,
    errorSummary,
    setTitle,
    setDescription,
    validateField,
    submitFeature,
  } = useNewFeature();

  return (
    <section className="form-page" aria-labelledby="new-feature-title">
      <a className="back-link" href="/features">
        ← Back to feature board
      </a>
      <div className="form-heading">
        <h1 className="page-title" id="new-feature-title">
          Add a feature
        </h1>
        <p className="page-intro">
          Describe the improvement you would like the product team to consider.
        </p>
      </div>
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      <form className="feature-form" onSubmit={submitFeature} noValidate>
        <div
          ref={errorSummary}
          className="form-error-summary"
          tabIndex={-1}
          aria-live="polite"
        >
          {(error || Object.keys(fieldErrors).length > 0) && (
            <p>Review the highlighted fields before saving.</p>
          )}
        </div>
        <FeatureFields
          title={title}
          description={description}
          fieldErrors={fieldErrors}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onFieldBlur={validateField}
        />
        <div className="form-actions">
          <a className="button button-secondary" href="/features">
            Cancel
          </a>
          <button
            className="button button-primary"
            type="submit"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save feature"}
          </button>
        </div>
      </form>
    </section>
  );
}
