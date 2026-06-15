import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export function GoogleSignInButton() {
  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  };

  return (
    <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
      Continue with Google
    </Button>
  );
}
