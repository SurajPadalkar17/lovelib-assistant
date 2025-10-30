import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Search, Users, Sparkles } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      setUser(session.user);
      
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(profileData);

      // Redirect to appropriate dashboard
      if (profileData) {
        navigate(profileData.role === "admin" ? "/admin" : "/student");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <Navigation user={user} profile={profile} />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-block">
            <div className="h-20 w-20 mx-auto rounded-full bg-gradient-primary flex items-center justify-center mb-6 animate-pulse">
              <BookOpen className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Welcome to Library Hub
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your digital gateway to knowledge. Discover, borrow, and read thousands of books 
            designed for students from Class 1 to 10.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center pt-6">
            <Button 
              size="lg" 
              variant="hero"
              onClick={() => navigate("/auth")}
              className="gap-2"
            >
              <Sparkles className="h-5 w-5" />
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need in One Place
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover:shadow-large transition-all hover:-translate-y-1">
              <CardContent className="pt-6 text-center space-y-4">
                <div className="h-14 w-14 mx-auto rounded-full bg-gradient-primary flex items-center justify-center">
                  <BookOpen className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Vast Collection</h3>
                <p className="text-muted-foreground">
                  Access thousands of books across all categories, from science to fiction
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-large transition-all hover:-translate-y-1">
              <CardContent className="pt-6 text-center space-y-4">
                <div className="h-14 w-14 mx-auto rounded-full bg-gradient-secondary flex items-center justify-center">
                  <Search className="h-7 w-7 text-secondary-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Smart Search</h3>
                <p className="text-muted-foreground">
                  Find books instantly with our intelligent search and AI assistant
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-large transition-all hover:-translate-y-1">
              <CardContent className="pt-6 text-center space-y-4">
                <div className="h-14 w-14 mx-auto rounded-full bg-gradient-accent flex items-center justify-center">
                  <Users className="h-7 w-7 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Easy Management</h3>
                <p className="text-muted-foreground">
                  Simple interface for students to browse and admins to manage the library
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto bg-gradient-hero text-primary-foreground">
          <CardContent className="p-12 text-center space-y-6">
            <h2 className="text-3xl font-bold">Ready to Start Reading?</h2>
            <p className="text-lg opacity-90">
              Join Library Hub today and unlock a world of knowledge
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate("/auth")}
              className="gap-2"
            >
              Create Your Account
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 Library Hub. Built for students, by educators.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
