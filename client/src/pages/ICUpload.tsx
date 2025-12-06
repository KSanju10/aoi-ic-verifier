import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type ICType = "PAN" | "AADHAAR" | "VOTER_ID" | "DRIVING_LICENSE" | "PASSPORT" | "OTHER";

export default function ICUpload() {
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [icType, setICType] = useState<ICType>("PAN");
  const [isProcessing, setIsProcessing] = useState(false);

  const uploadMutation = trpc.ic.upload.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      // Redirect to results page
      setTimeout(() => {
        navigate(`/verification/${data.verificationId}`, { replace: true });
      }, 500);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload IC image");
      setIsProcessing(false);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select an image first");
      return;
    }

    setIsProcessing(true);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = (e.target?.result as string).split(",")[1];

        uploadMutation.mutate({
          imageBase64: base64String,
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
          icType,
        });
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      toast.error("Failed to process file");
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const event = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(event);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            IC Verification
          </h1>
          <p className="text-lg text-gray-600">
            Upload your identity card for authenticity verification
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Upload Identity Card</CardTitle>
            <CardDescription>
              Select the type of ID and upload a clear image for verification
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* IC Type Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Identity Card Type
              </label>
              <Select value={icType} onValueChange={(value) => setICType(value as ICType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAN">PAN Card</SelectItem>
                  <SelectItem value="AADHAAR">Aadhaar Card</SelectItem>
                  <SelectItem value="VOTER_ID">Voter ID</SelectItem>
                  <SelectItem value="DRIVING_LICENSE">Driving License</SelectItem>
                  <SelectItem value="PASSPORT">Passport</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!preview ? (
                <div className="space-y-3">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div>
                    <p className="text-gray-700 font-medium">
                      Drag and drop your ID image here
                    </p>
                    <p className="text-sm text-gray-500">
                      or click to select from your computer
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg"
                  />
                  <p className="text-sm text-gray-600">
                    {selectedFile?.name}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setPreview(null);
                    }}
                  >
                    Change Image
                  </Button>
                </div>
              )}
            </div>

            {/* Information Alert */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Tips for best results:</strong>
                <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                  <li>Ensure the ID is clearly visible and well-lit</li>
                  <li>Avoid glare and shadows on the document</li>
                  <li>Include all four corners of the ID in the image</li>
                  <li>Keep the image straight and not rotated</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isProcessing}
              className="w-full h-12 text-base"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Upload and Verify
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Features Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <CheckCircle2 className="h-8 w-8 text-green-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">
                Authenticity Check
              </h3>
              <p className="text-sm text-gray-600">
                Verify if the ID is real or fake using advanced image analysis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <CheckCircle2 className="h-8 w-8 text-green-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">
                Format Validation
              </h3>
              <p className="text-sm text-gray-600">
                Check if the ID format is valid and not expired
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <CheckCircle2 className="h-8 w-8 text-green-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">
                Tampering Detection
              </h3>
              <p className="text-sm text-gray-600">
                Detect any signs of tampering or fake edits on the document
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
