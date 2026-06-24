import { SignUp } from '@clerk/react';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export default function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        appearance={{
          variables: {
            colorPrimary: 'hsl(150, 30%, 45%)',
            colorForeground: 'hsl(0, 0%, 18%)',
            colorMutedForeground: 'hsl(0, 0%, 45%)',
            colorBackground: 'var(--brand-surface)',
            colorInput: '#ffffff',
            colorInputForeground: 'hsl(0, 0%, 18%)',
            colorNeutral: 'hsl(35, 25%, 88%)',
            colorDanger: 'hsl(0, 72%, 51%)',
            fontFamily: '"Inter", sans-serif',
            borderRadius: '12px',
          },
          elements: {
            rootBox: 'w-full flex justify-center',
            cardBox: 'bg-[var(--brand-surface)] rounded-2xl w-[420px] max-w-full overflow-hidden shadow-lg border border-[hsl(35,25%,88%)]',
            card: '!shadow-none !border-0 !bg-transparent !rounded-none',
            footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
            headerTitle: 'text-foreground font-bold',
            headerSubtitle: 'text-muted-foreground',
            socialButtonsBlockButtonText: 'text-foreground font-medium',
            formFieldLabel: 'text-foreground font-medium',
            footerActionLink: 'text-[hsl(150,30%,40%)] font-medium',
            footerActionText: 'text-muted-foreground',
            dividerText: 'text-muted-foreground',
            identityPreviewEditButton: 'text-[hsl(150,30%,40%)]',
            formFieldSuccessText: 'text-[hsl(150,30%,40%)]',
            alertText: 'text-foreground',
            logoBox: 'mb-2',
            logoImage: 'h-10 w-10',
            socialButtonsBlockButton: 'border border-[hsl(35,25%,88%)] bg-white hover:bg-[hsl(35,20%,96%)]',
            formButtonPrimary: 'bg-[hsl(150,30%,45%)] hover:bg-[hsl(150,30%,38%)] text-white',
            formFieldInput: 'border-[hsl(35,25%,88%)] bg-white text-foreground',
            footerAction: 'bg-transparent',
            dividerLine: 'bg-[hsl(35,25%,88%)]',
            alert: 'border-[hsl(35,25%,88%)]',
            otpCodeFieldInput: 'border-[hsl(35,25%,88%)] bg-white text-foreground',
            formFieldRow: '',
            main: '',
          },
        }}
      />
    </div>
  );
}
