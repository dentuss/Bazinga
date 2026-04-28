import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Zap } from "lucide-react";
import { Link } from "react-router-dom";

const UnlimitedBanner = () => {
  const { user } = useAuth();
  const subscriptionType = user?.subscriptionType?.toLowerCase();
  const isUnlimited = subscriptionType === "unlimited";

  if (isUnlimited) {
    return null;
  }

  return (
    <section id="unlimited" className="py-8 border-y border-border bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-primary">
              {isUnlimited ? (
                <>
                  <Zap className="h-8 w-8 fill-primary" />
                  <span className="text-2xl font-black">WELCOME TO UNLIMITED EXPERIENCE</span>
                  <Zap className="h-8 w-8 fill-primary" />
                </>
              ) : (
                <>
                  <Zap className="h-8 w-8 fill-primary" />
                  <span className="text-2xl font-black">BAZINGA UNLIMITED</span>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground hidden lg:block">
              Want to read all these digital comics? Get instant access to all these and more!
            </p>
          </div>
          <Link to="/bazinga-unlimited">
            <Button variant="hero" size="lg" className="whitespace-nowrap">
              Join Now
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default UnlimitedBanner;
