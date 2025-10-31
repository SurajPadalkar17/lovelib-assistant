import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { ChatbotWidget } from "@/components/ChatbotWidget";
import { BookCard } from "@/components/BookCard";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [issuedBooks, setIssuedBooks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    // Check role from user_roles table (secure)
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "student")
      .maybeSingle();

    if (!profileData || !roleData) {
      navigate("/");
      return;
    }

    setProfile(profileData);
    await fetchBooks();
    await fetchIssuedBooks(session.user.id);
    setLoading(false);
  };

  const fetchBooks = async () => {
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .order("title");

    if (error) {
      toast({ variant: "destructive", title: "Error loading books" });
    } else {
      setBooks(data || []);
    }
  };

  const fetchIssuedBooks = async (userId: string) => {
    const { data, error } = await supabase
      .from("issued_books")
      .select(`
        *,
        books (*)
      `)
      .eq("student_id", userId)
      .eq("status", "issued");

    if (!error) {
      setIssuedBooks(data || []);
    }
  };

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <Navigation user={user} profile={profile} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {profile?.full_name}! 📚
          </h1>
          <p className="text-muted-foreground">
            Class {profile?.class_level} • Explore and discover amazing books
          </p>
        </div>

        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList>
            <TabsTrigger value="browse" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Browse Books
            </TabsTrigger>
            <TabsTrigger value="issued" className="gap-2">
              <Clock className="h-4 w-4" />
              My Books ({issuedBooks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Search */}
            <div className="relative max-w-2xl">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search books by title, author, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Books Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>

            {filteredBooks.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No books found matching your search" : "No books available"}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="issued" className="space-y-6">
            {issuedBooks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {issuedBooks.map((issued) => (
                  <div key={issued.id} className="space-y-2">
                    <BookCard book={issued.books} />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Due: {new Date(issued.due_date).toLocaleDateString()}
                      </span>
                      <Badge variant={
                        new Date(issued.due_date) < new Date() ? "destructive" : "secondary"
                      }>
                        {new Date(issued.due_date) < new Date() ? "Overdue" : "Active"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  You haven't issued any books yet
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <ChatbotWidget />
    </div>
  );
};

export default StudentDashboard;
