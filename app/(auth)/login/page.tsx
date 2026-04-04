import { SignInComponent } from "@/components/ui/sign-in";
import { Gem } from "lucide-react";

const LogoComponent = () => (
  <div className="bg-primary text-primary-foreground rounded-md p-1.5">
    <Gem className="h-4 w-4" />
  </div>
);

export default function LoginPage() {
  return <SignInComponent logo={<LogoComponent />} brandName="QuikScale" />;
}
