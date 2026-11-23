export interface DocsFieldItem {
  readonly name: string;
  readonly code?: string;
  readonly required?: boolean;
  readonly sample: string;
  readonly why: string;
}

export interface DocsLessonSection {
  readonly stepNum: '1' | '2' | '3' | '4';
  readonly title: string;
  readonly whatForBody: string;
  readonly breakdownHeading: string;
  readonly fields: ReadonlyArray<DocsFieldItem>;
  readonly tipHeading: string;
  readonly tipBody: string;
}

export interface DocsTranslations {
  readonly common: {
    readonly guideTitle: string;
    readonly stepsCountLabel: string;
    readonly backToGenerator: string;
    readonly previousStep: string;
    readonly nextStep: string;
    readonly startGeneratingCta: string;
    readonly stepOfFourPrefix: string;
    readonly stepOfFourConnector: string;
    readonly whatForHeading: string;
    readonly demoBannerTitle: string;
    readonly demoBannerBody: string;
    readonly sampleLabel: string;
    readonly requiredLabel: string;
    readonly optionalLabel: string;
    readonly copyBtn: string;
    readonly copiedBtn: string;
  };
  readonly nav: {
    readonly step1Short: string;
    readonly step2Short: string;
    readonly step3Short: string;
    readonly step4Short: string;
  };
  readonly overview: {
    readonly title: string;
    readonly subtitle: string;
    readonly startStep1Cta: string;
    readonly stepSummaries: ReadonlyArray<{
      readonly num: '1' | '2' | '3' | '4';
      readonly title: string;
      readonly summary: string;
    }>;
  };
  readonly lesson1: DocsLessonSection & {
    readonly rsaCompareLabel: string;
    readonly rsa2048Note: string;
    readonly rsa4096Note: string;
    readonly showPasswordLabel: string;
    readonly hidePasswordLabel: string;
  };
  readonly lesson2: DocsLessonSection & {
    readonly sampleExpiryLabel: string;
    readonly playRuleNote: string;
  };
  readonly lesson3: DocsLessonSection & {
    readonly cspSnippetLabel: string;
    readonly offlineCheckHeading: string;
    readonly offlineCheckSteps: readonly string[];
  };
  readonly lesson4: DocsLessonSection & {
    readonly gradleHeading: string;
    readonly githubActionsLabel: string;
    readonly keytoolLabel: string;
  };
}
