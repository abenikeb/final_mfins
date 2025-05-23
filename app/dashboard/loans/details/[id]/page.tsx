"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-provider";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
	AlertCircle,
	Calendar,
	CheckCircle,
	Clock,
	Download,
	FileText,
	Info,
	Loader2,
	PieChart,
	RefreshCw,
	User,
} from "lucide-react";

interface LoanDetail {
	id: number;
	memberId: number;
	amount: number;
	remainingAmount?: number;
	interestRate: number;
	tenureMonths: number;
	status: string;
	createdAt: string;
	member: {
		name: string;
		etNumber: number;
		email: string;
		phone: string;
	};
	approvalLogs: Array<{
		id: number;
		approvedByUserId: number;
		role: string;
		status: string;
		approvalOrder: number;
		comments: string;
		approvalDate: string;
		user: {
			name: string;
		};
	}>;
	loanRepayments: Array<{
		id: number;
		amount: number;
		paidAmount: number;
		repaymentDate: string;
		status: string;
		sourceType: string;
		reference?: string;
	}>;
	loanDocuments: Array<{
		id: number;
		documentType: string;
		documentUrl: string;
		fileName: string;
		uploadDate: string;
	}>;
}

interface PaymentFormData {
	repaymentId: number;
	amount: number;
	reference: string;
	sourceType: string;
}

export default function IndividualLoanDetailPage() {
	const [loanDetail, setLoanDetail] = useState<LoanDetail | null>(null);
	const [newStatus, setNewStatus] = useState<string>("");
	const [comments, setComments] = useState<string>("");
	const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
	const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [documentError, setDocumentError] = useState<string | null>(null);
	const [isDocumentLoading, setIsDocumentLoading] = useState(false);
	const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
	const [selectedRepayment, setSelectedRepayment] = useState<number | null>(
		null
	);
	const [paymentFormData, setPaymentFormData] = useState<PaymentFormData>({
		repaymentId: 0,
		amount: 0,
		reference: "",
		sourceType: "MANUAL_PAYMENT",
	});
	const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

	const params = useParams();
	const router = useRouter();
	const { toast } = useToast();
	const { user } = useAuth();

	useEffect(() => {
		fetchLoanDetail();
	}, []);

	const fetchLoanDetail = async () => {
		setIsLoading(true);
		try {
			const response = await fetch(`/api/loans/${params.id}`);
			if (response.ok) {
				const data = await response.json();
				setLoanDetail(data);
			} else {
				throw new Error("Failed to fetch loan detail");
			}
		} catch (error) {
			console.error("Error fetching loan detail:", error);
			toast({ title: "Failed to fetch loan detail", variant: "destructive" });
		} finally {
			setIsLoading(false);
		}
	};

	const handleStatusUpdate = async () => {
		try {
			const response = await fetch(`/api/loans/${params.id}/update-status`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					status: newStatus,
					comments: comments,
				}),
			});

			const data = await response.json();

			if (response.ok) {
				toast({
					title: "Loan status updated successfully",
					description:
						user?.role === "FINANCE_ADMIN" && newStatus === "APPROVED"
							? "The loan has been approved and disbursed."
							: `The loan status has been updated to ${newStatus}.`,
				});
				setIsUpdateDialogOpen(false);
				fetchLoanDetail(); // Refresh the loan details
			} else {
				throw new Error(data.error || "Failed to update loan status");
			}
		} catch (error) {
			console.error("Error updating loan status:", error);
			toast({
				title: "Failed to update loan status",
				description: (error as Error).message,
				variant: "destructive",
			});
		}
	};

	const handleDocumentReview = async (documentUrl: string) => {
		setIsDocumentLoading(true);
		setDocumentError(null);
		try {
			// Use the full path for local files
			const fullUrl = documentUrl.startsWith("http")
				? documentUrl
				: `/${documentUrl}`;
			const response = await fetch(
				`/api/loans/documents/view?url=${encodeURIComponent(fullUrl)}`
			);
			if (response.ok) {
				const blob = await response.blob();
				const url = URL.createObjectURL(blob);
				setSelectedDocument(url);
			} else {
				throw new Error("Failed to load document");
			}
		} catch (error) {
			console.error("Error loading document:", error);
			setDocumentError("Failed to load document. Please try again.");
		} finally {
			setIsDocumentLoading(false);
		}
	};

	const handleDownloadDocument = async (
		documentUrl: string,
		fileName: string
	) => {
		try {
			const fullUrl = documentUrl.startsWith("http")
				? documentUrl
				: `/${documentUrl}`;
			const response = await fetch(
				`/api/loans/documents/view?url=${encodeURIComponent(fullUrl)}`
			);
			if (response.ok) {
				const blob = await response.blob();
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = fileName;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			} else {
				throw new Error("Failed to download document");
			}
		} catch (error) {
			console.error("Error downloading document:", error);
			toast({
				title: "Failed to download document",
				description: "Please try again later.",
				variant: "destructive",
			});
		}
	};

	const openPaymentDialog = (repaymentId: number, amount: number) => {
		setSelectedRepayment(repaymentId);
		setPaymentFormData({
			repaymentId,
			amount,
			reference: "",
			sourceType: "MANUAL_PAYMENT",
		});
		setIsPaymentDialogOpen(true);
	};

	const handlePaymentSubmit = async () => {
		setIsSubmittingPayment(true);
		try {
			const response = await fetch(
				`/api/loans/${params.id}/repayments/${paymentFormData.repaymentId}/pay`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						amount: paymentFormData.amount,
						reference: paymentFormData.reference,
						sourceType: paymentFormData.sourceType,
					}),
				}
			);

			const data = await response.json();

			if (response.ok) {
				toast({
					title: "Payment recorded successfully",
					description: `Payment of ETB ${paymentFormData.amount.toFixed(
						2
					)} has been recorded.`,
				});
				setIsPaymentDialogOpen(false);
				fetchLoanDetail(); // Refresh the loan details
			} else {
				throw new Error(data.error || "Failed to record payment");
			}
		} catch (error) {
			console.error("Error recording payment:", error);
			toast({
				title: "Failed to record payment",
				description: (error as Error).message,
				variant: "destructive",
			});
		} finally {
			setIsSubmittingPayment(false);
		}
	};

	const getStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
			case "pending":
				return "bg-yellow-500";
			case "approved":
			case "paid":
				return "bg-green-500";
			case "rejected":
				return "bg-red-500";
			case "disbursed":
				return "bg-blue-500";
			case "overdue":
				return "bg-red-600";
			case "verified":
				return "bg-emerald-500";
			case "repaid":
				return "bg-green-700";
			default:
				return "bg-gray-500";
		}
	};

	// Calculate loan summary statistics
	const loanSummary = useMemo(() => {
		if (!loanDetail) return null;

		const totalAmount = Number(loanDetail.amount);
		const interestRate = Number(loanDetail.interestRate) / 100;
		const tenureMonths = loanDetail.tenureMonths;

		// Simple interest calculation
		const totalInterest = totalAmount * interestRate * (tenureMonths / 12);
		const totalRepayable = totalAmount + totalInterest;
		const monthlyPayment = totalRepayable / tenureMonths;

		// Calculate paid and remaining amounts
		// const totalPaid = loanDetail.loanRepayments.reduce(
		// 	(sum, repayment) => sum + Number(repayment.paidAmount),
		// 	0
		// );

		const totalPaid = loanDetail.loanRepayments.reduce((sum, repayment) => {
			if (repayment.paidAmount !== undefined) {
				return sum + Number(repayment.paidAmount);
			} else if (repayment.status === "PAID") {
				return sum + Number(repayment.amount);
			}
			return sum;
		}, 0);

		const remainingAmount =
			loanDetail.remainingAmount !== undefined
				? Number(loanDetail.remainingAmount)
				: totalRepayable - totalPaid;

		// Calculate progress percentage
		const progressPercentage = Math.min(
			100,
			(totalPaid / totalRepayable) * 100
		);

		// Count repayments by status
		const repaymentStatusCounts = loanDetail.loanRepayments.reduce(
			(counts, repayment) => {
				const status = repayment.status.toLowerCase();
				counts[status] = (counts[status] || 0) + 1;
				return counts;
			},
			{} as Record<string, number>
		);

		return {
			totalAmount,
			totalInterest,
			totalRepayable,
			monthlyPayment,
			totalPaid,
			remainingAmount,
			progressPercentage,
			repaymentStatusCounts,
		};
	}, [loanDetail]);

	// Check if next payment is due
	const nextPaymentDue = useMemo(() => {
		if (!loanDetail) return null;

		const pendingRepayments = loanDetail.loanRepayments
			.filter((r) => r.status.toLowerCase() === "pending")
			.sort(
				(a, b) =>
					new Date(a.repaymentDate).getTime() -
					new Date(b.repaymentDate).getTime()
			);

		return pendingRepayments.length > 0 ? pendingRepayments[0] : null;
	}, [loanDetail]);

	const renderDocumentViewer = () => {
		if (!selectedDocument) return null;

		return (
			<Dialog
				open={!!selectedDocument}
				onOpenChange={() => setSelectedDocument(null)}>
				<DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
					<DialogHeader>
						<DialogTitle>Document Viewer</DialogTitle>
					</DialogHeader>
					<div className="flex-grow overflow-hidden">
						{isDocumentLoading ? (
							<div className="flex items-center justify-center h-full">
								<Loader2 className="h-12 w-12 animate-spin text-primary" />
							</div>
						) : documentError ? (
							<div className="text-center text-red-500 p-4">
								{documentError}
							</div>
						) : (
							<iframe
								src={selectedDocument}
								className="w-full h-full border-0"
								title="Document Viewer"
							/>
						)}
					</div>
					<div className="flex justify-end space-x-2 mt-4">
						<Button variant="outline" onClick={() => setSelectedDocument(null)}>
							Close
						</Button>
						<Button onClick={() => setIsUpdateDialogOpen(true)}>
							Update Loan Status
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		);
	};

	const renderLoanSummary = () => {
		if (!loanSummary) return null;

		return (
			<Card className="bg-white">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<PieChart className="h-5 w-5" />
						Loan Summary
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="space-y-4">
							<div>
								<h3 className="text-sm font-medium text-muted-foreground">
									Loan Progress
								</h3>
								<div className="mt-2 space-y-2">
									<Progress
										value={loanSummary.progressPercentage}
										className="h-2"
									/>
									<div className="flex justify-between text-sm">
										<span>
											{loanSummary.progressPercentage.toFixed(0)}% Complete
										</span>
										<span>
											ETB {loanSummary.totalPaid.toFixed(2)} / ETB{" "}
											{loanSummary.totalRepayable.toFixed(2)}
										</span>
									</div>
								</div>
							</div>

							{nextPaymentDue && (
								<div className="p-3 border rounded-md bg-amber-50">
									<div className="flex items-start gap-2">
										<Calendar className="h-5 w-5 text-amber-600 mt-0.5" />
										<div>
											<h4 className="font-medium">Next Payment Due</h4>
											<p className="text-sm text-muted-foreground">
												ETB {Number(nextPaymentDue.amount).toFixed(2)} on{" "}
												{new Date(
													nextPaymentDue.repaymentDate
												).toLocaleDateString()}
											</p>
											<Button
												size="sm"
												className="mt-2"
												onClick={() =>
													openPaymentDialog(
														nextPaymentDue.id,
														Number(nextPaymentDue.amount)
													)
												}>
												Record Payment
											</Button>
										</div>
									</div>
								</div>
							)}
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="p-3 border rounded-md">
								<h3 className="text-sm font-medium text-muted-foreground">
									Principal
								</h3>
								<p className="text-2xl font-bold">
									ETB {loanSummary.totalAmount.toFixed(2)}
								</p>
							</div>
							<div className="p-3 border rounded-md">
								<h3 className="text-sm font-medium text-muted-foreground">
									Interest
								</h3>
								<p className="text-2xl font-bold">
									ETB {loanSummary.totalInterest.toFixed(2)}
								</p>
							</div>
							<div className="p-3 border rounded-md">
								<h3 className="text-sm font-medium text-muted-foreground">
									Monthly Payment
								</h3>
								<p className="text-2xl font-bold">
									ETB {loanSummary.monthlyPayment.toFixed(2)}
								</p>
							</div>
							<div className="p-3 border rounded-md">
								<h3 className="text-sm font-medium text-muted-foreground">
									Remaining
								</h3>
								<p className="text-2xl font-bold">
									ETB {loanSummary.remainingAmount.toFixed(2)}
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	};

	const renderRepaymentSchedule = () => (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Calendar className="h-5 w-5" />
					Repayment Schedule
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Due Date</TableHead>
							<TableHead>Amount</TableHead>
							<TableHead>Paid</TableHead>
							<TableHead>Remaining</TableHead>
							<TableHead>Source</TableHead>
							<TableHead>Reference</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Action</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loanDetail?.loanRepayments.map((repayment) => {
							const amount = Number(repayment.amount);
							const paidAmount = Number(repayment.paidAmount);
							const remainingAmount = amount - paidAmount;
							const isPending = repayment.status.toLowerCase() === "pending";
							const isOverdue =
								isPending && new Date(repayment.repaymentDate) < new Date();

							return (
								<TableRow
									key={repayment.id}
									className={isOverdue ? "bg-red-50" : ""}>
									<TableCell>
										{new Date(repayment.repaymentDate).toLocaleDateString()}
									</TableCell>
									<TableCell>ETB {amount.toFixed(2)}</TableCell>
									<TableCell>ETB {paidAmount.toFixed(2)}</TableCell>
									<TableCell>ETB {remainingAmount.toFixed(2)}</TableCell>
									<TableCell>
										{repayment.sourceType.replace("_", " ")}
									</TableCell>
									<TableCell>{repayment.reference || "-"}</TableCell>
									<TableCell>
										<Badge
											className={getStatusColor(
												isOverdue ? "OVERDUE" : repayment.status
											)}>
											{isOverdue ? "OVERDUE" : repayment.status}
										</Badge>
									</TableCell>
									<TableCell>
										{isPending && (
											<Button
												size="sm"
												variant="outline"
												onClick={() =>
													openPaymentDialog(repayment.id, remainingAmount)
												}>
												Pay
											</Button>
										)}
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[400px]">
				<Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
				<p className="text-muted-foreground">Loading loan details...</p>
			</div>
		);
	}

	if (!loanDetail) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[400px] text-center">
				<AlertCircle className="h-12 w-12 text-red-500 mb-4" />
				<h2 className="text-xl font-bold mb-2">Loan Not Found</h2>
				<p className="text-muted-foreground mb-4">
					The requested loan could not be found or you don't have permission to
					view it.
				</p>
				<Button onClick={() => router.back()} variant="outline">
					Back to Loan List
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<Button
					onClick={() => router.back()}
					variant="outline"
					className="w-full sm:w-auto">
					Back to Loan List
				</Button>
				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={fetchLoanDetail}
						className="w-full sm:w-auto">
						<RefreshCw className="h-4 w-4 mr-2" />
						Refresh
					</Button>
					<Button
						onClick={() => setIsUpdateDialogOpen(true)}
						className="w-full sm:w-auto">
						Update Loan Status
					</Button>
				</div>
			</div>

			<Card>
				<CardHeader className="pb-2">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
						<CardTitle className="flex items-center gap-2">
							<User className="h-5 w-5" />
							Loan Details - Loan ID: {loanDetail.id}
						</CardTitle>
						<Badge
							className={`${getStatusColor(
								loanDetail.status
							)} text-white px-3 py-1`}>
							{loanDetail.status}
						</Badge>
					</div>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
						<div>
							<h3 className="text-sm font-medium text-muted-foreground">
								Member Name
							</h3>
							<p className="font-medium">{loanDetail.member.name}</p>
						</div>
						<div>
							<h3 className="text-sm font-medium text-muted-foreground">
								ET Number
							</h3>
							<p className="font-medium">{loanDetail.member.etNumber}</p>
						</div>
						<div>
							<h3 className="text-sm font-medium text-muted-foreground">
								Email
							</h3>
							<p className="font-medium">{loanDetail.member.email}</p>
						</div>
						<div>
							<h3 className="text-sm font-medium text-muted-foreground">
								Phone
							</h3>
							<p className="font-medium">{loanDetail.member.phone}</p>
						</div>
						<div>
							<h3 className="text-sm font-medium text-muted-foreground">
								Loan Amount
							</h3>
							<p className="font-medium">
								ETB {Number(loanDetail.amount).toFixed(2)}
							</p>
						</div>
						<div>
							<h3 className="text-sm font-medium text-muted-foreground">
								Interest Rate
							</h3>
							<p className="font-medium">{loanDetail.interestRate}%</p>
						</div>
						<div>
							<h3 className="text-sm font-medium text-muted-foreground">
								Tenure
							</h3>
							<p className="font-medium">{loanDetail.tenureMonths} months</p>
						</div>
						<div>
							<h3 className="text-sm font-medium text-muted-foreground">
								Created At
							</h3>
							<p className="font-medium">
								{new Date(loanDetail.createdAt).toLocaleString()}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{renderLoanSummary()}

			<Tabs defaultValue="repayments" className="w-full">
				<TabsList className="grid grid-cols-3 mb-4">
					<TabsTrigger value="repayments" className="flex items-center gap-2">
						<Calendar className="h-4 w-4" />
						<span className="hidden sm:inline">Repayment Schedule</span>
						<span className="sm:hidden">Repayments</span>
					</TabsTrigger>
					<TabsTrigger value="documents" className="flex items-center gap-2">
						<FileText className="h-4 w-4" />
						<span className="hidden sm:inline">Loan Documents</span>
						<span className="sm:hidden">Documents</span>
					</TabsTrigger>
					<TabsTrigger value="approvals" className="flex items-center gap-2">
						<CheckCircle className="h-4 w-4" />
						<span className="hidden sm:inline">Approval History</span>
						<span className="sm:hidden">Approvals</span>
					</TabsTrigger>
				</TabsList>

				<TabsContent value="repayments">
					{renderRepaymentSchedule()}
				</TabsContent>

				<TabsContent value="documents">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<FileText className="h-5 w-5" />
								Loan Documents
							</CardTitle>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Document Type</TableHead>
										<TableHead>File Name</TableHead>
										<TableHead>Upload Date</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{loanDetail.loanDocuments.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={4}
												className="text-center py-6 text-muted-foreground">
												No documents available for this loan
											</TableCell>
										</TableRow>
									) : (
										loanDetail.loanDocuments.map((doc) => (
											<TableRow key={doc.id}>
												<TableCell>
													<div className="flex items-center gap-2">
														<FileText className="h-4 w-4 text-muted-foreground" />
														{doc.documentType}
													</div>
												</TableCell>
												<TableCell>{doc.fileName}</TableCell>
												<TableCell>
													{new Date(doc.uploadDate).toLocaleString()}
												</TableCell>
												<TableCell className="text-right">
													<div className="flex justify-end gap-2">
														<Button
															size="sm"
															variant="outline"
															onClick={() =>
																handleDocumentReview(doc.documentUrl)
															}>
															View
														</Button>
														<Button
															size="sm"
															variant="outline"
															onClick={() =>
																handleDownloadDocument(
																	doc.documentUrl,
																	doc.fileName
																)
															}>
															<Download className="h-4 w-4" />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="approvals">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Clock className="h-5 w-5" />
								Approval History
							</CardTitle>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Approved By</TableHead>
										<TableHead>Role</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Comments</TableHead>
										<TableHead>Date</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{loanDetail.approvalLogs.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={5}
												className="text-center py-6 text-muted-foreground">
												No approval history available for this loan
											</TableCell>
										</TableRow>
									) : (
										loanDetail.approvalLogs.map((log) => (
											<TableRow key={log.id}>
												<TableCell>{log.user.name}</TableCell>
												<TableCell>{log.role}</TableCell>
												<TableCell>
													<Badge className={getStatusColor(log.status)}>
														{log.status}
													</Badge>
												</TableCell>
												<TableCell>{log.comments || "-"}</TableCell>
												<TableCell>
													{new Date(log.approvalDate).toLocaleString()}
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{renderDocumentViewer()}

			<Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Update Loan Status</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<Select onValueChange={setNewStatus}>
							<SelectTrigger>
								<SelectValue placeholder="Select new status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="PENDING">Pending</SelectItem>
								<SelectItem value="VERIFIED">Verified</SelectItem>
								<SelectItem value="APPROVED">Approved</SelectItem>
								<SelectItem value="REJECTED">Rejected</SelectItem>
								<SelectItem value="DISBURSED">Disbursed</SelectItem>
								<SelectItem value="REPAID">Repaid</SelectItem>
							</SelectContent>
						</Select>
						<Textarea
							placeholder="Enter comments"
							value={comments}
							onChange={(e) => setComments(e.target.value)}
						/>
						<Button onClick={handleStatusUpdate}>Update Status</Button>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Record Loan Payment</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="amount">Payment Amount (ETB)</Label>
							<Input
								id="amount"
								type="number"
								step="0.01"
								value={paymentFormData.amount}
								onChange={(e) =>
									setPaymentFormData({
										...paymentFormData,
										amount: Number.parseFloat(e.target.value) || 0,
									})
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="reference">Reference/Transaction ID</Label>
							<Input
								id="reference"
								value={paymentFormData.reference}
								onChange={(e) =>
									setPaymentFormData({
										...paymentFormData,
										reference: e.target.value,
									})
								}
								placeholder="e.g., Bank transfer reference"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="sourceType">Payment Source</Label>
							<Select
								value={paymentFormData.sourceType}
								onValueChange={(value) =>
									setPaymentFormData({
										...paymentFormData,
										sourceType: value,
									})
								}>
								<SelectTrigger id="sourceType">
									<SelectValue placeholder="Select payment source" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ERP_PAYROLL">ERP Payroll</SelectItem>
									<SelectItem value="MANUAL_PAYMENT">Manual Payment</SelectItem>
									<SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsPaymentDialogOpen(false)}>
							Cancel
						</Button>
						<Button
							onClick={handlePaymentSubmit}
							disabled={isSubmittingPayment || paymentFormData.amount <= 0}>
							{isSubmittingPayment ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Processing...
								</>
							) : (
								"Record Payment"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{loanDetail.status === "PENDING" && (
				<Card className="border-yellow-200 bg-yellow-50">
					<CardContent className="pt-6">
						<div className="flex items-start gap-3">
							<Info className="h-5 w-5 text-yellow-600 mt-0.5" />
							<div>
								<h3 className="font-medium">Loan Approval Pending</h3>
								<p className="text-sm text-muted-foreground mt-1">
									This loan is awaiting approval. You can update the status
									using the "Update Loan Status" button.
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
