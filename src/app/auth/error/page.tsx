import { CardWrapper } from '@/components/auth/card-wrapper';

const AuthErrorPage = () => {
  return (
    <CardWrapper
      headerLabel="Oops! Something went wrong!"
      backButtonLabel="Back to login"
      backButtonHref="/login"
    >
      <div className="w-full flex justify-center items-center">
        <p className="text-muted-foreground text-sm">There was an error during authentication.</p>
      </div>
    </CardWrapper>
  );
};

export default AuthErrorPage;