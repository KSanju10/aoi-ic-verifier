import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Loader2, Upload, BarChart3, Shield, Zap, Lock } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">AOI IC Verifier</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-gray-700">Welcome, {user?.name || "User"}</span>
                <Button onClick={() => navigate("/dashboard")}>Dashboard</Button>
              </>
            ) : (
              <Button asChild>
                <a href={getLoginUrl()}>Sign In</a>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Verify Identity Cards with AI-Powered Accuracy
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Detect fake markings, verify authenticity, and ensure document integrity using advanced optical inspection technology.
            </p>
            {isAuthenticated ? (
              <Button
                size="lg"
                onClick={() => navigate("/upload")}
                className="text-lg h-12"
              >
                <Upload className="mr-2 h-5 w-5" />
                Start Verification
              </Button>
            ) : (
              <Button
                size="lg"
                asChild
                className="text-lg h-12"
              >
                <a href={getLoginUrl()}>
                  Get Started
                </a>
              </Button>
            )}
          </div>

          <div className="relative">
            <div className="bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Shield className="h-6 w-6" />
                  <span>Authenticity Verification</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Zap className="h-6 w-6" />
                  <span>Real-Time Processing</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Lock className="h-6 w-6" />
                  <span>Secure & Private</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Comprehensive Verification Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Authenticity Check</CardTitle>
                <CardDescription>
                  Verify if the ID is real or fake
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Advanced image analysis detects forgeries, fake markings, and counterfeit documents with high accuracy.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Zap className="h-8 w-8 text-yellow-600 mb-2" />
                <CardTitle>Format Validation</CardTitle>
                <CardDescription>
                  Check validity and expiry status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Validates ID number format, checks expiry dates, and ensures all mandatory fields are present and correct.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Lock className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Tampering Detection</CardTitle>
                <CardDescription>
                  Detect unauthorized modifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Identifies signs of tampering, font mismatches, blur, and other indicators of document manipulation.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>OCR Extraction</CardTitle>
                <CardDescription>
                  Extract text and data automatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Automatically extracts name, ID number, date of birth, and other details from identity documents.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="h-8 w-8 text-red-600 mb-2" />
                <CardTitle>QR Code Validation</CardTitle>
                <CardDescription>
                  Verify QR code authenticity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Validates QR codes and ensures the encoded data matches the extracted information from the document.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Lock className="h-8 w-8 text-indigo-600 mb-2" />
                <CardTitle>Database Verification</CardTitle>
                <CardDescription>
                  Cross-check with official records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Matches extracted information against official government databases to verify authenticity and ownership.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Supported ID Types */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Supported Identity Documents
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { name: "PAN Card", icon: "🪪" },
              { name: "Aadhaar Card", icon: "📋" },
              { name: "Voter ID", icon: "🗳️" },
              { name: "Driving License", icon: "🚗" },
              { name: "Passport", icon: "✈️" },
            ].map((doc) => (
              <Card key={doc.name} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="text-4xl mb-3">{doc.icon}</div>
                  <p className="font-semibold text-gray-900">{doc.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: 1,
                title: "Upload Image",
                description: "Upload a clear photo of your identity card",
              },
              {
                step: 2,
                title: "Extract Data",
                description: "AI extracts text and information using OCR",
              },
              {
                step: 3,
                title: "Verify Details",
                description: "System validates format and checks for tampering",
              },
              {
                step: 4,
                title: "Get Results",
                description: "Receive detailed verification report instantly",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {isAuthenticated ? (
        <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16 px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Verify Your ID?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Start the verification process in seconds
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/upload")}
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg h-12"
            >
              <Upload className="mr-2 h-5 w-5" />
              Upload Your ID Now
            </Button>
          </div>
        </section>
      ) : (
        <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16 px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-4xl font-bold mb-4">
              Get Started Today
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Sign in to verify your identity documents securely
            </p>
            <Button
              size="lg"
              asChild
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg h-12"
            >
              <a href={getLoginUrl()}>
                Sign In to Get Started
              </a>
            </Button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                AOI IC Verifier
              </h3>
              <p className="text-gray-400 text-sm">
                Advanced identity verification using optical inspection technology.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-white">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 AOI IC Verifier. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
