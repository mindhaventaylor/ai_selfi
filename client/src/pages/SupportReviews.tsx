import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Linkedin, ChevronLeft, ChevronRight } from "lucide-react";

export default function SupportReviews() {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);

  // Dummy reviews data
  const reviews = [
    {
      id: 1,
      name: "Marta Giménez Carrión",
      title: "Fundadora conmdemarketing",
      review: "40 fotacas profesionales por 30 euros. Pues ¿Qué quieres que te diga?... ¡Es una pasada! Ideal para quien empieza con su marca y no puede pagar una sesión profesional que cuesta por encima de los 250€....",
      date: "Oct 8, 2025",
      image: "/image.webp",
      hasImage: true,
    },
    {
      id: 2,
      name: "Alba Ripoll Cucó",
      title: "Technology and Automation Co...",
      review: "Fotos nuevas en 15 minutos. Hace un tiempo probé una IA para generar fotos profesionales, pero el resultado me pareció poco natural para mi estilo. Gracias a Laura Pérez Hoyos y Jorge Bosch...",
      date: "May 22, 2025",
      hasImage: false,
    },
    {
      id: 3,
      name: "Jorge Bosch Alés",
      title: "Creador de Cosas de Freelance",
      review: "He renovado todas mis fotos en 15 minutos. 4 pasos para que tú puedes hacerlo 1 Selecciona 10 - 20 fotos Que sean de calidad y donde salgas...",
      date: "Mar 18, 2025",
      hasImage: false,
    },
    {
      id: 4,
      name: "Faby U",
      title: "CEO @BizGrow Growth Partner",
      review: "No solo me encantó — me sacó una sonrisa de oreja a oreja. Fue rápido, y el nivel de detalle... ¡Una locura! Hasta las uñas rosadas me dejó perfectas 💅 Real. Profesional. MIL GRACIAS!",
      rating: 5,
      date: "Apr 25, 2025",
      image: "/image_1.webp",
      hasImage: true,
    },
    {
      id: 5,
      name: "Andres Montano",
      title: "Marketing Expert",
      review: "Subí un par de fotos para alimentar al modelo (realmente me costó encontrar fotos mías) y, para mi sorpresa, en unos minutos ya tenía una galería de fotos que parecían hechas en estudio. Nada de filtros exagerados. Solo una versión...",
      date: "Jul 29, 2025",
      hasImage: false,
    },
    {
      id: 6,
      name: "Andrea P.",
      title: "I Help you land a job at Big Tec...",
      review: "Hoy en día no hay excusas para tener una foto poco profesional. Y es que yo misma acabo de crear 40 fotos mías en solo 10 minutos. Todo ello gracias aiselfi, una herramienta de inteligencia artificial que crea fotos...",
      date: "Apr 25, 2025",
      hasImage: false,
    },
    {
      id: 7,
      name: "Pamela Salas",
      title: "Te ayudo a encontrar trabajo al...",
      review: "mi foto es de aiselfi.es y wow con lo real",
      date: "Oct 6, 2025",
      hasImage: false,
    },
    {
      id: 8,
      name: "Ingrid Mora Rodríguez",
      title: "Transformo Culturas",
      review: "Totalmente recomendado: Por el resultado, por la atención y por la experiencia de sentir que detrás de cada proceso digital, todavía hay personas que hacen la diferencia. Hace 5 meses, cuando decidí transformar mi...",
      date: "Apr 25, 2025",
      hasImage: false,
    },
    {
      id: 9,
      name: "Samuel Tavira",
      title: "",
      review: "La calidad de las fotos es estupenda, muy contento. Utilizo estas fotos para perfil profesional de redes. Incluso he recibido comentarios positivos sobre ellas. Gracias!",
      rating: 5,
      date: "Nov 5, 2025",
      hasImage: false,
    },
  ];

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
                    Dejar una Reseña
                  </h2>
                  <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                </div>
                <p className="text-muted-foreground">
                  ¡Nos encantaría conocer tu experiencia con AISelfies!
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
                      Do you enjoy using aiselfi.es?
                    </p>
                    <p className="text-sm text-muted-foreground">
                      On a scale of 1 to 5, how would you rate us?
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
                    Continue
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* What Users Say Section */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-2">
            Lo que Dicen los Usuarios
          </h2>
          <p className="text-muted-foreground">
            Lee lo que nuestra comunidad dice sobre AlSelfies
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
                    Leer mas
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
            Ver más
          </Button>
        </div>
      </div>
    </div>
  );
}
