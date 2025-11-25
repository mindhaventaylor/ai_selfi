import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowRight } from "lucide-react";

export default function Blog() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const blogPosts = [
    {
      id: 1,
      title: "How AI Professional Photos Can Transform Your Personal Brand",
      excerpt: "Discover how AI-powered professional photos can revolutionize your personal branding and help you stand out in the digital world.",
      date: "January 15, 2025",
      image: "/image.jpg",
      slug: "/blog/how-ai-professional-photos-transform-personal-brand",
    },
    {
      id: 2,
      title: "5 Reasons Why AI Professional Photos Are Better Than Traditional Photography",
      excerpt: "Explore the five key advantages that make AI professional photos superior to traditional photography methods.",
      date: "January 20, 2025",
      image: "/image_1.jpg",
      slug: "/blog/5-reasons-ai-photos-better-than-traditional",
    },
    {
      id: 3,
      title: "How to Choose the Perfect Professional Photo Style for Your Brand",
      excerpt: "Learn how to select the ideal professional photo style that matches your industry, platform, and personal brand values.",
      date: "January 25, 2025",
      image: "/image_10.jpg",
      slug: "/blog/choose-perfect-professional-photo-style",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
          <p className="text-xl text-muted-foreground">
            Tips, insights, and guides on professional photography and personal branding
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <Card
              key={post.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setLocation(post.slug)}
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-2">{post.date}</p>
                <h2 className="text-xl font-bold mb-3">{post.title}</h2>
                <p className="text-muted-foreground mb-4 line-clamp-3">{post.excerpt}</p>
                <Button
                  variant="ghost"
                  className="p-0 h-auto font-semibold"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation(post.slug);
                  }}
                >
                  Read more
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

