import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Download,
  Share2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function VerificationResults() {
  const [, navigate] = useLocation();
  const [params] = useRoute("/verification/:id");
  const verificationId = (params as any)?.id ? parseInt((params as any).id) : null;

  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: verification, isLoading, refetch } = trpc.ic.getResults.useQuery(
    { verificationId: verificationId || 0 },
    {
      enabled: !!verificationId,
      refetchInterval: autoRefresh ? 2000 : false,
    }
  );

  useEffect(() => {
    if (verification && verification.verificationStatus !== "PROCESSING") {
      setAutoRefresh(false);
    }
  }, [verification?.verificationStatus]);

  if (!verificationId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-red-600">Invalid verification ID</p>
            <Button onClick={() => navigate("/")} className="mt-4 w-full">
              Go Back Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Loading verification results...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!verification) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-red-600">Verification record not found</p>
            <Button onClick={() => navigate("/")} className="mt-4 w-full">
              Go Back Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isProcessing = verification.verificationStatus === "PROCESSING";
  const isVerified = verification.verificationStatus === "VERIFIED";
  const isInvalid = verification.verificationStatus === "INVALID";
  const isSuspicious = verification.verificationStatus === "SUSPICIOUS";

  const getStatusColor = () => {
    if (isVerified) return "bg-green-50 border-green-200";
    if (isInvalid) return "bg-red-50 border-red-200";
    if (isSuspicious) return "bg-yellow-50 border-yellow-200";
    return "bg-blue-50 border-blue-200";
  };

  const getStatusIcon = () => {
    if (isVerified) return <CheckCircle2 className="h-8 w-8 text-green-600" />;
    if (isInvalid) return <AlertCircle className="h-8 w-8 text-red-600" />;
    if (isSuspicious) return <AlertTriangle className="h-8 w-8 text-yellow-600" />;
    return <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />;
  };

  const getStatusBadge = () => {
    if (isVerified) return <Badge className="bg-green-600">Verified</Badge>;
    if (isInvalid) return <Badge className="bg-red-600">Invalid</Badge>;
    if (isSuspicious) return <Badge className="bg-yellow-600">Suspicious</Badge>;
    return <Badge className="bg-blue-600">Processing</Badge>;
  };

  const extractedData = (verification?.extractedData as any) || {};
  const results = (verification?.verificationResults as any) || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Upload
        </Button>

        {/* Status Card */}
        <Card className={`border-2 mb-6 ${getStatusColor()}`}>
          <CardContent className="pt-8">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                {getStatusIcon()}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Verification Result
                    </h2>
                    {getStatusBadge()}
                  </div>
                  <p className="text-gray-600">
                    {isProcessing && "Your document is being analyzed..."}
                    {isVerified && "Your identity card has been verified as authentic."}
                    {isInvalid && "Your identity card appears to be invalid."}
                    {isSuspicious && "Your identity card requires further review."}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Processing Status */}
        {isProcessing && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Processing Status
                  </p>
                  <Progress value={60} className="h-2" />
                </div>
                <p className="text-sm text-gray-600">
                  Your document is being analyzed. This may take a few moments...
                </p>
                <Button onClick={() => refetch()} variant="outline" className="w-full">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refresh Status
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confidence Scores */}
        {!isProcessing && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Confidence Scores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Overall Confidence
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {verification?.overallConfidence}%
                  </span>
                </div>
                <Progress
                  value={Number(verification.overallConfidence) || 0}
                  className="h-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Authenticity
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {verification?.authenticityScore}%
                    </span>
                  </div>
                  <Progress
                    value={Number(verification.authenticityScore) || 0}
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Validity
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {verification?.validityScore}%
                    </span>
                  </div>
                  <Progress
                    value={Number(verification.validityScore) || 0}
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Extracted Information */}
        {extractedData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Extracted Information</CardTitle>
              <CardDescription>
                Data extracted from your identity card
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {extractedData.icNumber && (
                  <div>
                    <p className="text-sm text-gray-600">ID Number</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {extractedData.icNumber}
                    </p>
                  </div>
                )}
                {extractedData.holderName && (
                  <div>
                    <p className="text-sm text-gray-600">Holder Name</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {extractedData.holderName}
                    </p>
                  </div>
                )}
                {extractedData.dateOfBirth && (
                  <div>
                    <p className="text-sm text-gray-600">Date of Birth</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {extractedData.dateOfBirth}
                    </p>
                  </div>
                )}
                {extractedData.expiryDate && (
                  <div>
                    <p className="text-sm text-gray-600">Expiry Date</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {extractedData.expiryDate}
                    </p>
                  </div>
                )}
                {extractedData.address && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {extractedData.address}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verification Details */}
        {!isProcessing && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Verification Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-700">Authenticity Check</span>
                {verification.isAuthentic ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-700">Format Validation</span>
                {verification.isValid ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-700">Tampering Detection</span>
                {!verification.isTampered ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-700">Database Match</span>
                {verification.matchesDatabase ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Issues and Warnings */}
        {results && (results.issues?.length > 0 || results.warnings?.length > 0) && (
          <>
            {results.issues?.length > 0 && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Issues Found:</strong>
                  <ul className="list-disc list-inside mt-2">
                    {results.issues.map((issue: string, idx: number) => (
                      <li key={idx}>{issue}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {results.warnings?.length > 0 && (
              <Alert className="mb-4 border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Warnings:</strong>
                  <ul className="list-disc list-inside mt-2">
                    {results.warnings.map((warning: string, idx: number) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button className="flex-1" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Verify Another ID
          </Button>
          <Button variant="outline" className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
          <Button variant="outline" className="flex-1">
            <Share2 className="mr-2 h-4 w-4" />
            Share Result
          </Button>
        </div>
      </div>
    </div>
  );
}
