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
      title: t("blog.posts.post1.title"),
      excerpt: t("blog.posts.post1.excerpt"),
      date: t("blog.posts.post1.date"),
      image: "/image.webp",
      slug: "/blog/how-ai-professional-photos-transform-personal-brand",
    },
    {
      id: 2,
      title: t("blog.posts.post2.title"),
      excerpt: t("blog.posts.post2.excerpt"),
      date: t("blog.posts.post2.date"),
      image: "/image_1.webp",
      slug: "/blog/5-reasons-ai-photos-better-than-traditional",
    },
    {
      id: 3,
      title: t("blog.posts.post3.title"),
      excerpt: t("blog.posts.post3.excerpt"),
      date: t("blog.posts.post3.date"),
      image: "/image_10.webp",
      slug: "/blog/choose-perfect-professional-photo-style",
    },
    {
      id: 4,
      title: t("blog.posts.post4.title"),
      excerpt: t("blog.posts.post4.excerpt"),
      date: t("blog.posts.post4.date"),
      image: "/image_100.webp",
      slug: "/blog/how-to-use-ai-professional-photos-for-linkedin",
    },
    {
      id: 5,
      title: t("blog.posts.post5.title"),
      excerpt: t("blog.posts.post5.excerpt"),
      date: t("blog.posts.post5.date"),
      image: "/image_101.webp",
      slug: "/blog/ai-headshots-vs-traditional-photography-cost-comparison",
    },
    {
      id: 6,
      title: t("blog.posts.post6.title"),
      excerpt: t("blog.posts.post6.excerpt"),
      date: t("blog.posts.post6.date"),
      image: "/over100_1.webp",
      slug: "/blog/best-practices-training-ai-model-professional-photos",
    },
    {
      id: 7,
      title: t("blog.posts.post7.title"),
      excerpt: t("blog.posts.post7.excerpt"),
      date: t("blog.posts.post7.date"),
      image: "/over100_2.webp",
      slug: "/blog/why-ai-generated-professional-photos-future-personal-branding",
    },
    {
      id: 8,
      title: t("blog.posts.post8.title"),
      excerpt: t("blog.posts.post8.excerpt"),
      date: t("blog.posts.post8.date"),
      image: "/over100_3.webp",
      slug: "/blog/how-to-create-multiple-professional-photo-styles-with-ai",
    },
    {
      id: 9,
      title: t("blog.posts.post9.title"),
      excerpt: t("blog.posts.post9.excerpt"),
      date: t("blog.posts.post9.date"),
      image: "/over100_4.webp",
      slug: "/blog/complete-guide-ai-professional-photography-2024",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("blog.title")}</h1>
          <p className="text-xl text-muted-foreground">
            {t("blog.subtitle")}
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
                  {t("blog.readMore")}
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

