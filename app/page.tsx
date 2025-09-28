import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, History, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Screenshot Compare
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Compare screenshots and get AI-powered insights. Perfect for tracking competitor changes, A/B tests, and product demos.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <Upload className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Upload & Compare</CardTitle>
              <CardDescription>
                Drop two screenshots and get instant visual comparisons
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle>AI Insights</CardTitle>
              <CardDescription>
                Get ≤5 key changes plus "so what" implications automatically
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <History className="h-10 w-10 text-primary mb-2" />
              <CardTitle>History</CardTitle>
              <CardDescription>
                Track all your comparisons with simple feedback
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center space-y-4">
          <Button asChild size="lg">
            <Link href="/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload Screenshots
            </Link>
          </Button>

          <div>
            <Button variant="outline" asChild>
              <Link href="/history">
                <History className="mr-2 h-4 w-4" />
                View History
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
