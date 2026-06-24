import { useEffect, useRef } from 'react';
import { Switch, Route, Router as WouterRouter } from "wouter";
import { ClerkProvider, SignIn, SignUp } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useClerk } from '@clerk/react';
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNav from "@/components/BottomNav";
import TopMenuButton from "@/components/TopMenuButton";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Home from "@/pages/Home";
import Note from "@/pages/Note";
import Timeline from "@/pages/Timeline";
import CalendarPage from "@/pages/Calendar";
import Tracker from "@/pages/Tracker";
import Health from "@/pages/Health";
import Settings from "@/pages/Settings";
import Appearance from "@/pages/Appearance";
import Profile from "@/pages/Profile";
import Invite from "@/pages/Invite";
import Privacy from "@/pages/Privacy";
import Help from "@/pages/Help";
import ReportProblem from "@/pages/ReportProblem";
import About from "@/pages/About";
import Circle from "@/pages/Circle";
import NotFound from "@/pages/not-found";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const queryClient = new QueryClient();

const CLERK_APPEARANCE = {
  variables: {
    colorPrimary: 'hsl(150, 30%, 45%)',
    colorForeground: 'hsl(0, 0%, 18%)',
    colorMutedForeground: 'hsl(0, 0%, 45%)',
    colorBackground: '#FDFBF7',
    colorInput: '#ffffff',
    colorInputForeground: 'hsl(0, 0%, 18%)',
    colorNeutral: 'hsl(35, 25%, 88%)',
    colorDanger: 'hsl(0, 72%, 51%)',
    fontFamily: '"Inter", sans-serif',
    borderRadius: '12px',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#FDFBF7] rounded-2xl w-[420px] max-w-full overflow-hidden shadow-lg border border-[hsl(35,25%,88%)]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-foreground font-bold',
    headerSubtitle: 'text-muted-foreground',
    socialButtonsBlockButtonText: 'text-foreground font-medium',
    formFieldLabel: 'text-foreground font-medium',
    footerActionLink: 'text-[hsl(150,30%,40%)] font-medium',
    footerActionText: 'text-muted-foreground',
    dividerText: 'text-muted-foreground',
    formButtonPrimary: 'bg-[hsl(150,30%,45%)] hover:bg-[hsl(150,30%,38%)] text-white',
    formFieldInput: 'border-[hsl(35,25%,88%)] bg-white text-foreground',
    socialButtonsBlockButton: 'border border-[hsl(35,25%,88%)] bg-white hover:bg-[hsl(35,20%,96%)]',
    footerAction: 'bg-transparent',
    dividerLine: 'bg-[hsl(35,25%,88%)]',
    otpCodeFieldInput: 'border-[hsl(35,25%,88%)] bg-white text-foreground',
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} appearance={CLERK_APPEARANCE} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} appearance={CLERK_APPEARANCE} />
    </div>
  );
}

function ClerkCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsub = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) qc.clear();
      prevUserIdRef.current = userId;
    });
    return unsub;
  }, [addListener, qc]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/note" component={Note} />
      <Route path="/timeline" component={Timeline} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/tracker" component={Tracker} />
      <Route path="/health" component={Health} />
      <Route path="/settings" component={Settings} />
      <Route path="/settings/appearance" component={Appearance} />
      <Route path="/settings/profile" component={Profile} />
      <Route path="/settings/invite" component={Invite} />
      <Route path="/settings/privacy" component={Privacy} />
      <Route path="/settings/help" component={Help} />
      <Route path="/settings/report" component={ReportProblem} />
      <Route path="/settings/about" component={About} />
      <Route path="/circle" component={Circle} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const { dir } = useLanguage();

  return (
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <div
          className="relative min-h-screen bg-background"
          style={{ maxWidth: '480px', margin: '0 auto' }}
          dir={dir}
        >
          <ClerkCacheInvalidator />

          {/* Persistent top-right menu button */}
          <div className="fixed top-3 right-3 z-[100]">
            <TopMenuButton />
          </div>

          <main>
            <Router />
          </main>
          <BottomNav />
        </div>

        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--brand-surface)',
              border: '1px solid var(--brand-primary)',
              color: 'hsl(var(--foreground))',
              borderRadius: '12px',
              fontSize: '14px',
            },
          }}
        />
      </WouterRouter>
    </TooltipProvider>
  );
}

function App() {
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      routerPush={(to) => { window.history.pushState(null, '', to); window.dispatchEvent(new PopStateEvent('popstate')); }}
      routerReplace={(to) => { window.history.replaceState(null, '', to); window.dispatchEvent(new PopStateEvent('popstate')); }}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      afterSignOutUrl={basePath || "/"}
    >
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <ThemeProvider>
            <ProfileProvider>
              <AppLayout />
            </ProfileProvider>
          </ThemeProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
