import { render, type RenderOptions } from "@testing-library/react";
import { type ReactElement, type ReactNode } from "react";
import { vi } from "vitest";
import { AuthProvider } from "@/contexts/AuthContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { CalendarProvider } from "@/contexts/CalendarContext";

vi.mock("@/lib/auth/supabaseAuth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/supabaseAuth")>();
  const mockUnsubscribe = vi.fn();
  const mockSubscription = {
    unsubscribe: mockUnsubscribe,
  };

  const createMockClient = () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn((callback) => {
        callback("SIGNED_OUT", null);
        return {
          data: {
            subscription: mockSubscription,
          },
        };
      }),
    },
  });

  return {
    ...actual,
    createSupabaseClientForAuth: vi.fn(createMockClient),
    signInWithGoogle: vi.fn(),
  };
});

function AllTheProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <CalendarProvider>{children}</CalendarProvider>
      </OnboardingProvider>
    </AuthProvider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  withProviders?: boolean;
}

function customRender(ui: ReactElement, options?: CustomRenderOptions) {
  const { withProviders = true, ...renderOptions } = options || {};

  if (!withProviders) {
    return render(ui, renderOptions);
  }

  return render(ui, { wrapper: AllTheProviders, ...renderOptions });
}

export {
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
  fireEvent,
  act,
  renderHook,
  findAllByRole,
  findByRole,
  getAllByRole,
  getByRole,
  queryAllByRole,
  queryByRole,
  findAllByLabelText,
  findByLabelText,
  getAllByLabelText,
  getByLabelText,
  queryAllByLabelText,
  queryByLabelText,
  findAllByPlaceholderText,
  findByPlaceholderText,
  getAllByPlaceholderText,
  getByPlaceholderText,
  queryAllByPlaceholderText,
  queryByPlaceholderText,
  findAllByText,
  findByText,
  getAllByText,
  getByText,
  queryAllByText,
  queryByText,
  findAllByDisplayValue,
  findByDisplayValue,
  getAllByDisplayValue,
  getByDisplayValue,
  queryAllByDisplayValue,
  queryByDisplayValue,
  findAllByAltText,
  findByAltText,
  getAllByAltText,
  getByAltText,
  queryAllByAltText,
  queryByAltText,
  findAllByTitle,
  findByTitle,
  getAllByTitle,
  getByTitle,
  queryAllByTitle,
  queryByTitle,
  findAllByTestId,
  findByTestId,
  getAllByTestId,
  getByTestId,
  queryAllByTestId,
  queryByTestId,
} from "@testing-library/react";

export { customRender as render };
