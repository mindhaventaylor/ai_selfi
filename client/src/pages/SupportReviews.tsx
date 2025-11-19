import { useTranslation } from "@/hooks/useTranslation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Linkedin, ChevronLeft, ChevronRight } from "lucide-react";

export default function SupportReviews() {
  const { t } = useTranslation();
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);

  const reviewsData = t("supportReviews.reviews", { returnObjects: true }) as Array<{ name: string; title: string; review: string; date: string }>;
  const reviews = reviewsData.map((review, idx) => ({
    id: idx + 1,
    name: review.name,
    title: review.title,
    review: review.review,
    date: review.date,
    image: idx === 0 ? "/image.webp" : idx === 3 ? "/image_1.webp" : undefined,
    hasImage: idx === 0 || idx === 3,
    rating: idx === 3 || idx === 8 ? 5 : undefined,
  }));

  const handleRatingClick = (value: number) => {
    setRating(value);
  };

  const handleSubmit = () => {
    // TODO: Connect to Supabase later
    console.log("Rating submitted:", rating);
    // Reset form after submission
    setRating(0);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Leave a Review Section */}
        <Card className="bg-card/50 border-border mb-8">
          <CardContent className="p-6 md:p-8">
            <div className="text-center space-y-6">
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h2 className="text-2xl md:text-3xl font-bold">
                    {t("supportReviews.leaveReview")}
                  </h2>
                  <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                </div>
                <p className="text-muted-foreground">
                  {t("supportReviews.weWouldLove")}
                </p>
              </div>

              {/* Rating Popup Card */}
              <Card className="bg-card border-border max-w-md mx-auto">
                <CardContent className="p-6 space-y-6">
                  {/* Logo */}
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Star className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-semibold text-lg">aiselfi.es</span>
                  </div>

                  {/* Question */}
                  <div className="space-y-4">
                    <p className="text-lg font-medium">
                      {t("supportReviews.doYouEnjoy")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("supportReviews.howWouldYouRate")}
                    </p>

                    {/* Star Rating */}
                    <div className="flex items-center justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleRatingClick(value)}
                          onMouseEnter={() => setHoveredRating(value)}
                          onMouseLeave={() => setHoveredRating(0)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-10 h-10 transition-colors ${
                              value <= (hoveredRating || rating)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Continue Button */}
                  <Button
                    className="w-full bg-muted hover:bg-muted/80 text-foreground rounded-full"
                    onClick={handleSubmit}
                    disabled={rating === 0}
                  >
                    {t("supportReviews.continue")}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* What Users Say Section */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-2">
            {t("supportReviews.whatUsersSay")}
          </h2>
          <p className="text-muted-foreground">
            {t("supportReviews.readCommunity")}
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <Card key={review.id} className="bg-card/50 border-border">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* User Info */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <span className="text-sm font-medium">
                        {review.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate">
                          {review.name}
                        </h3>
                        <Linkedin className="w-4 h-4 text-blue-400 shrink-0" />
                      </div>
                      {review.title && (
                        <p className="text-xs text-muted-foreground truncate">
                          {review.title}
                        </p>
                      )}
                      {review.rating && (
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= review.rating!
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Review Text */}
                  <p className="text-sm text-muted-foreground line-clamp-4">
                    {review.review}
                  </p>
                  <button className="text-xs text-primary hover:underline">
                    {t("supportReviews.readMore")}
                  </button>

                  {/* Image Carousel (if has image) */}
                  {review.hasImage && review.image && (
                    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden group">
                      <img
                        src={review.image}
                        alt={review.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-between px-2 opacity-0 group-hover:opacity-100">
                        <button className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Date */}
                  <p className="text-xs text-muted-foreground">{review.date}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More Button */}
        <div className="text-center mt-8">
          <Button variant="outline" className="rounded-full">
            {t("supportReviews.seeMore")}
          </Button>
        </div>
      </div>
    </div>
  );
}
