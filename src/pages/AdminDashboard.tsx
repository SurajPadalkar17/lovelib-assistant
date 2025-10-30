import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { ChatbotWidget } from "@/components/ChatbotWidget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Users, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BookCard } from "@/components/BookCard";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [issuedBooks, setIssuedBooks] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddBook, setShowAddBook] = useState(false);
  
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    category: "",
    price: "",
    summary: "",
    total_copies: "1",
    available_copies: "1",
  });

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

    if (!profileData || profileData.role !== "admin") {
      navigate("/");
      return;
    }

    setProfile(profileData);
    await fetchData();
    setLoading(false);
  };

  const fetchData = async () => {
    // Fetch books
    const { data: booksData } = await supabase
      .from("books")
      .select("*")
      .order("title");
    setBooks(booksData || []);

    // Fetch issued books
    const { data: issuedData } = await supabase
      .from("issued_books")
      .select(`
        *,
        books (*),
        profiles (full_name, class_level)
      `)
      .eq("status", "issued");
    setIssuedBooks(issuedData || []);

    // Fetch students
    const { data: studentsData } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "student")
      .order("full_name");
    setStudents(studentsData || []);
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.from("books").insert({
      ...newBook,
      price: parseFloat(newBook.price) || null,
      total_copies: parseInt(newBook.total_copies),
      available_copies: parseInt(newBook.available_copies),
    });

    if (error) {
      toast({ variant: "destructive", title: "Error adding book", description: error.message });
    } else {
      toast({ title: "Book added successfully!" });
      setShowAddBook(false);
      setNewBook({
        title: "",
        author: "",
        category: "",
        price: "",
        summary: "",
        total_copies: "1",
        available_copies: "1",
      });
      fetchData();
    }
  };

  const handleReturnBook = async (issuedBookId: string) => {
    const { error } = await supabase
      .from("issued_books")
      .update({ status: "returned", returned_at: new Date().toISOString() })
      .eq("id", issuedBookId);

    if (error) {
      toast({ variant: "destructive", title: "Error returning book" });
    } else {
      toast({ title: "Book returned successfully!" });
      fetchData();
    }
  };

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
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your library books, students, and issued books
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Books</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{books.length}</div>
              <p className="text-xs text-muted-foreground">
                {books.reduce((sum, b) => sum + b.available_copies, 0)} available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Issued Books</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{issuedBooks.length}</div>
              <p className="text-xs text-muted-foreground">Currently borrowed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="books" className="space-y-6">
          <TabsList>
            <TabsTrigger value="books">Books</TabsTrigger>
            <TabsTrigger value="issued">Issued Books</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
          </TabsList>

          <TabsContent value="books" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Book Collection</h2>
              <Dialog open={showAddBook} onOpenChange={setShowAddBook}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Book
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Book</DialogTitle>
                    <DialogDescription>Fill in the book details</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddBook} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={newBook.title}
                          onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="author">Author *</Label>
                        <Input
                          id="author"
                          value={newBook.author}
                          onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Input
                          id="category"
                          value={newBook.category}
                          onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Price</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={newBook.price}
                          onChange={(e) => setNewBook({ ...newBook, price: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="total">Total Copies *</Label>
                        <Input
                          id="total"
                          type="number"
                          min="1"
                          value={newBook.total_copies}
                          onChange={(e) => setNewBook({ ...newBook, total_copies: e.target.value, available_copies: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="summary">Summary</Label>
                      <Textarea
                        id="summary"
                        value={newBook.summary}
                        onChange={(e) => setNewBook({ ...newBook, summary: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <Button type="submit" className="w-full">Add Book</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="issued" className="space-y-6">
            <h2 className="text-xl font-semibold">Currently Issued Books</h2>
            <div className="space-y-4">
              {issuedBooks.map((issued) => (
                <Card key={issued.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded bg-gradient-primary flex items-center justify-center">
                          <BookOpen className="h-8 w-8 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{issued.books.title}</h3>
                          <p className="text-sm text-muted-foreground">{issued.books.author}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm">
                              Issued to: {issued.profiles.full_name} (Class {issued.profiles.class_level})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Due Date</p>
                        <p className="font-semibold">{new Date(issued.due_date).toLocaleDateString()}</p>
                        <Badge variant={new Date(issued.due_date) < new Date() ? "destructive" : "secondary"} className="mt-1">
                          {new Date(issued.due_date) < new Date() ? "Overdue" : "Active"}
                        </Badge>
                      </div>
                      <Button onClick={() => handleReturnBook(issued.id)}>
                        Mark Returned
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {issuedBooks.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No books currently issued</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <h2 className="text-xl font-semibold">Registered Students</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student) => (
                <Card key={student.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{student.full_name}</CardTitle>
                    <CardDescription>Class {student.class_level}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <ChatbotWidget />
    </div>
  );
};

export default AdminDashboard;
