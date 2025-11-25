import { useTranslation } from "@/hooks/useTranslation";

export default function Refund() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-4xl mx-auto px-4 py-16">
        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Refund Policy
          </h1>
          
          <p className="text-muted-foreground mb-6">
            Last updated: January 2025
          </p>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            Full Refund Guarantee
          </h2>

          <p className="mb-4">
            At AISelfi, we stand behind the quality of our AI-generated professional photos. 
            We offer a full refund guarantee if you are not satisfied with the results.
          </p>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            Refund Eligibility
          </h2>

          <p className="mb-4">
            You are eligible for a full refund if:
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>You are not satisfied with the quality of the generated photos</li>
            <li>The photos do not meet your expectations</li>
            <li>You experience technical issues that prevent you from using the service</li>
            <li>You request a refund within 30 days of purchase</li>
          </ul>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            How to Request a Refund
          </h2>

          <p className="mb-4">
            To request a refund, please contact our support team through one of the following methods:
          </p>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Email us at support@aiselfi.es</li>
            <li>Use the support form in your dashboard</li>
            <li>Contact us through WhatsApp (if available)</li>
          </ul>

          <p className="mb-4">
            Please include your order number and a brief explanation of why you're requesting 
            a refund. We'll process your refund within 5-7 business days.
          </p>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            Refund Processing
          </h2>

          <p className="mb-4">
            Once your refund is approved, we will process it to the original payment method 
            used for the purchase. Refunds typically appear in your account within 5-10 
            business days, depending on your payment provider.
          </p>

          <h2 className="text-3xl font-bold mt-8 mb-4">
            Questions?
          </h2>

          <p className="mb-8">
            If you have any questions about our refund policy, please don't hesitate to 
            contact our support team. We're here to help ensure you have a positive 
            experience with AISelfi.
          </p>
        </article>
      </main>
    </div>
  );
}

