import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Eye,
  Trash2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [limit] = useState(50);
  const [offset] = useState(0);

  const { data: historyData, isLoading, refetch } = trpc.ic.getHistory.useQuery({
    limit,
    offset,
  });

  const deleteMutation = trpc.ic.delete.useMutation({
    onSuccess: () => {
      toast.success("Verification record deleted");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete record");
    },
  });

  const verifications = historyData?.data || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return (
          <Badge className="bg-green-600 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Verified
          </Badge>
        );
      case "INVALID":
        return (
          <Badge className="bg-red-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Invalid
          </Badge>
        );
      case "SUSPICIOUS":
        return (
          <Badge className="bg-yellow-600 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Suspicious
          </Badge>
        );
      case "PROCESSING":
        return (
          <Badge className="bg-blue-600 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getICTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PAN: "PAN Card",
      AADHAAR: "Aadhaar",
      VOTER_ID: "Voter ID",
      DRIVING_LICENSE: "Driving License",
      PASSPORT: "Passport",
      OTHER: "Other",
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Verification Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              View and manage your IC verification history
            </p>
          </div>
          <Button onClick={() => navigate("/")} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            New Verification
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-600 text-sm font-medium">Total Verifications</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {historyData?.count || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-600 text-sm font-medium">Verified</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {verifications.filter((v) => v.verificationStatus === "VERIFIED").length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-600 text-sm font-medium">Invalid</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {verifications.filter((v) => v.verificationStatus === "INVALID").length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-600 text-sm font-medium">Suspicious</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {verifications.filter((v) => v.verificationStatus === "SUSPICIOUS").length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Verification History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Verification History</CardTitle>
            <CardDescription>
              All your IC verification records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : verifications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No verification records yet</p>
                <Button
                  onClick={() => navigate("/")}
                  className="mt-4"
                >
                  Start Your First Verification
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {verifications.map((verification) => (
                      <TableRow key={verification.id}>
                        <TableCell className="font-medium">
                          {getICTypeLabel(verification.icType)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(verification.verificationStatus)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${Number(verification.overallConfidence) || 0}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium">
                              {verification.overallConfidence}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {verification.uploadedAt
                            ? formatDistanceToNow(new Date(verification.uploadedAt), {
                                addSuffix: true,
                              })
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(`/verification/${verification.id}`)
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (
                                  confirm(
                                    "Are you sure you want to delete this record?"
                                  )
                                ) {
                                  deleteMutation.mutate({
                                    verificationId: verification.id,
                                  });
                                }
                              }}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
