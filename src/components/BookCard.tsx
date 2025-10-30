import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Download } from "lucide-react";

interface BookCardProps {
  book: {
    id: string;
    title: string;
    author: string;
    category: string;
    summary?: string | null;
    cover_image_url?: string | null;
    available_copies: number;
    ebook_url?: string | null;
  };
  onViewDetails?: (bookId: string) => void;
  onIssueBook?: (bookId: string) => void;
}

export const BookCard = ({ book, onViewDetails, onIssueBook }: BookCardProps) => {
  return (
    <Card className="group hover:shadow-medium transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      <div className="h-48 bg-gradient-primary relative overflow-hidden">
        {book.cover_image_url ? (
          <img 
            src={book.cover_image_url} 
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <BookOpen className="w-16 h-16 text-primary-foreground opacity-50" />
          </div>
        )}
        {book.available_copies === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive">Not Available</Badge>
          </div>
        )}
      </div>
      
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-1 text-lg">{book.title}</CardTitle>
          {book.available_copies > 0 && (
            <Badge variant="secondary" className="shrink-0">
              {book.available_copies} left
            </Badge>
          )}
        </div>
        <CardDescription className="line-clamp-1">{book.author}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{book.category}</Badge>
          {book.ebook_url && (
            <Badge variant="outline" className="gap-1">
              <Download className="w-3 h-3" />
              eBook
            </Badge>
          )}
        </div>
        
        {book.summary && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {book.summary}
          </p>
        )}
        
        <div className="flex gap-2 pt-2">
          {onViewDetails && (
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onViewDetails(book.id)}
            >
              View Details
            </Button>
          )}
          {onIssueBook && book.available_copies > 0 && (
            <Button 
              className="flex-1"
              onClick={() => onIssueBook(book.id)}
            >
              Issue Book
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
