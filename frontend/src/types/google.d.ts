export {};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            ux_mode?: "popup" | "redirect";
          }) => void;
          prompt: (callback?: (notification: GooglePromptMomentNotification) => void) => void;
          renderButton: (parent: HTMLElement, options: GoogleButtonConfiguration) => void;
        };
        oauth2?: {
          initCodeClient: (config: GoogleCodeClientConfiguration) => GoogleCodeClient;
        };
      };
    };
  }

  interface GoogleCodeClient {
    requestCode: () => void;
  }

  interface GoogleCodeClientConfiguration {
    client_id: string;
    scope: string;
    ux_mode?: "popup" | "redirect";
    callback: (response: GoogleCodeResponse) => void;
    error_callback?: (error: GoogleCodeClientError) => void;
  }

  interface GoogleCodeResponse {
    code?: string;
    error?: string;
    error_description?: string;
  }

  interface GoogleCodeClientError {
    type?: "popup_failed_to_open" | "popup_closed" | "unknown";
  }

  interface GoogleButtonConfiguration {
    type?: "standard" | "icon";
    theme?: "outline" | "filled_blue" | "filled_black";
    size?: "large" | "medium" | "small";
    text?: "signin_with" | "signup_with" | "continue_with" | "signin";
    shape?: "rectangular" | "pill" | "circle" | "square";
    logo_alignment?: "left" | "center";
    width?: string;
    locale?: string;
  }

  interface GooglePromptMomentNotification {
    isNotDisplayed: () => boolean;
    isSkippedMoment: () => boolean;
    isDismissedMoment: () => boolean;
  }
}
