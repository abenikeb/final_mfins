import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { UserRole, LoanApprovalStatus } from "@prisma/client";

const approvalOrder: { [key in UserRole]: number } = {
	MEMBER: 0,
	LOAN_OFFICER: 1,
	BRANCH_MANAGER: 2,
	REGIONAL_MANAGER: 3,
	FINANCE_ADMIN: 4,
};

export async function POST(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	const session = await getSession();
	if (!session || !session.id || session.role === "MEMBER") {
		console.log("Unauthorized access attempt or invalid session");
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const loanId = Number.parseInt(params.id, 10);
	const { status, comments } = await req.json();

	console.log(
		`Updating loan ${loanId} to status ${status} with comments: ${comments}`
	);

	try {
		const loan = await prisma.loan.findUnique({
			where: { id: loanId },
			include: {
				approvalLogs: {
					orderBy: { approvalOrder: "desc" },
					take: 1,
				},
			},
		});

		if (!loan) {
			console.log(`Loan with id ${loanId} not found`);
			return NextResponse.json({ error: "Loan not found" }, { status: 404 });
		}

		if (loan.status === "DISBURSED" || loan.status === "REJECTED") {
			console.log(
				`Cannot update loan ${loanId} as it is already in a final state: ${loan.status}`
			);
			return NextResponse.json(
				{ error: "Loan is already in a final state" },
				{ status: 400 }
			);
		}

		const lastApproval = loan.approvalLogs[0];
		const currentApprovalOrder = approvalOrder[session.role as UserRole];

		console.log(
			`Last approval order: ${lastApproval?.approvalOrder}, Current approval order: ${currentApprovalOrder}`
		);

		if (lastApproval && currentApprovalOrder <= lastApproval.approvalOrder) {
			console.log(
				`Invalid approval order. Last: ${lastApproval.approvalOrder}, Current: ${currentApprovalOrder}`
			);
			return NextResponse.json(
				{ error: "Invalid approval order" },
				{ status: 400 }
			);
		}

		// Determine the new loan status based on the user's role and the selected status
		let newLoanStatus: LoanApprovalStatus = status as LoanApprovalStatus;
		if (status === "APPROVED") {
			if (session.role === "FINANCE_ADMIN") {
				newLoanStatus = "DISBURSED";
			} else {
				newLoanStatus = "APPROVED";
			}
		}

		// Update loan status and create approval log
		const updatedLoan = await prisma.loan.update({
			where: { id: loanId },
			data: {
				status: newLoanStatus,
				approvalLogs: {
					create: {
						approvedByUserId: session.id,
						role: session.role as UserRole,
						status: status as LoanApprovalStatus,
						approvalOrder: currentApprovalOrder,
						comments: comments,
					},
				},
			},
		});

		// If the loan status is changed to DISBURSED, create LoanRepayment records
		if (newLoanStatus === "DISBURSED") {
			await createLoanRepayments(updatedLoan);
		}

		console.log(
			`Loan ${loanId} updated successfully. New status: ${newLoanStatus}`
		);

		return NextResponse.json(updatedLoan);
	} catch (error) {
		console.error("Error updating loan status:", error);
		return NextResponse.json(
			{
				error: "Failed to update loan status",
				details: (error as Error).message,
			},
			{ status: 500 }
		);
	}
}

async function createLoanRepayments(loan: any) {
	const { id, amount, interestRate, tenureMonths } = loan;
	const monthlyInterestRate = interestRate / 100 / 12;
	const monthlyPayment =
		(amount *
			monthlyInterestRate *
			Math.pow(1 + monthlyInterestRate, tenureMonths)) /
		(Math.pow(1 + monthlyInterestRate, tenureMonths) - 1);

	const repayments = [];
	let remainingBalance = amount;
	const startDate = new Date();

	for (let i = 1; i <= tenureMonths; i++) {
		const interestPayment = remainingBalance * monthlyInterestRate;
		const principalPayment = monthlyPayment - interestPayment;
		remainingBalance -= principalPayment;

		const repaymentDate = new Date(startDate);
		repaymentDate.setMonth(startDate.getMonth() + i);

		repayments.push({
			loanId: id,
			amount: Number(monthlyPayment.toFixed(2)),
			repaymentDate,
			sourceType: "ERP_PAYROLL",
			status: "PENDING",
			reference: `Principal: ${principalPayment.toFixed(
				2
			)}, Interest: ${interestPayment.toFixed(2)}`,
		});
	}

	// Adjust the last repayment to account for any rounding errors
	const totalCalculatedAmount = repayments.reduce(
		(sum, repayment) => sum + repayment.amount,
		0
	);
	const discrepancy = Number((amount - totalCalculatedAmount).toFixed(2));

	if (discrepancy !== 0) {
		const lastRepayment = repayments[repayments.length - 1];
		lastRepayment.amount += discrepancy;

		// Update the reference to reflect the adjusted principal
		const [principalStr, interestStr] = lastRepayment.reference.split(", ");
		const principal =
			Number.parseFloat(principalStr.split(": ")[1]) + discrepancy;
		lastRepayment.reference = `Principal: ${principal.toFixed(
			2
		)}, ${interestStr}`;
	}

	await prisma.loanRepayment.createMany({
		data: repayments,
	} as any);
}

// import { type NextRequest, NextResponse } from "next/server";
// import { getSession } from "@/lib/auth";
// import prisma from "@/lib/prisma";
// import type { UserRole, LoanApprovalStatus } from "@prisma/client";

// const approvalOrder: { [key in UserRole]: number } = {
// 	MEMBER: 0,
// 	LOAN_OFFICER: 1,
// 	BRANCH_MANAGER: 2,
// 	REGIONAL_MANAGER: 3,
// 	FINANCE_ADMIN: 4,
// };

// export async function POST(
// 	req: NextRequest,
// 	{ params }: { params: { id: string } }
// ) {
// 	const session = await getSession();
// 	if (!session || !session.id || session.role === "MEMBER") {
// 		console.log("Unauthorized access attempt or invalid session");
// 		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
// 	}

// 	const loanId = Number.parseInt(params.id, 10);
// 	const { status, comments } = await req.json();

// 	console.log(
// 		`Updating loan ${loanId} to status ${status} with comments: ${comments}`
// 	);

// 	try {
// 		const loan = await prisma.loan.findUnique({
// 			where: { id: loanId },
// 			include: {
// 				approvalLogs: {
// 					orderBy: { approvalOrder: "desc" },
// 					take: 1,
// 				},
// 			},
// 		});

// 		if (!loan) {
// 			console.log(`Loan with id ${loanId} not found`);
// 			return NextResponse.json({ error: "Loan not found" }, { status: 404 });
// 		}

// 		if (loan.status === "DISBURSED" || loan.status === "REJECTED") {
// 			console.log(
// 				`Cannot update loan ${loanId} as it is already in a final state: ${loan.status}`
// 			);
// 			return NextResponse.json(
// 				{ error: "Loan is already in a final state" },
// 				{ status: 400 }
// 			);
// 		}

// 		const lastApproval = loan.approvalLogs[0];
// 		const currentApprovalOrder = approvalOrder[session.role as UserRole];

// 		console.log(
// 			`Last approval order: ${lastApproval?.approvalOrder}, Current approval order: ${currentApprovalOrder}`
// 		);

// 		if (lastApproval && currentApprovalOrder <= lastApproval.approvalOrder) {
// 			console.log(
// 				`Invalid approval order. Last: ${lastApproval.approvalOrder}, Current: ${currentApprovalOrder}`
// 			);
// 			return NextResponse.json(
// 				{ error: "Invalid approval order" },
// 				{ status: 400 }
// 			);
// 		}

// 		// Determine the new loan status based on the user's role and the selected status
// 		let newLoanStatus: LoanApprovalStatus = status as LoanApprovalStatus;
// 		if (status === "APPROVED") {
// 			if (session.role === "FINANCE_ADMIN") {
// 				newLoanStatus = "DISBURSED";
// 			} else {
// 				newLoanStatus = "APPROVED";
// 			}
// 		}

// 		// Update loan status and create approval log
// 		const updatedLoan = await prisma.loan.update({
// 			where: { id: loanId },
// 			data: {
// 				status: newLoanStatus,
// 				approvalLogs: {
// 					create: {
// 						approvedByUserId: session.id,
// 						role: session.role as UserRole,
// 						status: status as LoanApprovalStatus,
// 						approvalOrder: currentApprovalOrder,
// 						comments: comments,
// 					},
// 				},
// 			},
// 		});

// 		// If the loan status is changed to DISBURSED, create LoanRepayment records
// 		if (newLoanStatus === "DISBURSED") {
// 			await createLoanRepayments(updatedLoan);
// 		}

// 		console.log(
// 			`Loan ${loanId} updated successfully. New status: ${newLoanStatus}`
// 		);

// 		return NextResponse.json(updatedLoan);
// 	} catch (error) {
// 		console.error("Error updating loan status:", error);
// 		return NextResponse.json(
// 			{
// 				error: "Failed to update loan status",
// 				details: (error as Error).message,
// 			},
// 			{ status: 500 }
// 		);
// 	}
// }

// async function createLoanRepayments(loan: any) {
// 	const { id, amount, interestRate, tenureMonths } = loan;
// 	const monthlyInterestRate = interestRate / 100 / 12;
// 	const monthlyPayment =
// 		(amount *
// 			monthlyInterestRate *
// 			Math.pow(1 + monthlyInterestRate, tenureMonths)) /
// 		(Math.pow(1 + monthlyInterestRate, tenureMonths) - 1);

// 	const repayments = [];
// 	let remainingBalance = amount;
// 	const startDate = new Date();

// 	for (let i = 1; i <= tenureMonths; i++) {
// 		const interestPayment = remainingBalance * monthlyInterestRate;
// 		const principalPayment = monthlyPayment - interestPayment;
// 		remainingBalance -= principalPayment;

// 		const repaymentDate = new Date(startDate);
// 		repaymentDate.setMonth(startDate.getMonth() + i);

// 		repayments.push({
// 			loanId: id,
// 			amount: monthlyPayment,
// 			repaymentDate,
// 			sourceType: "ERP_PAYROLL",
// 			status: "PENDING",
// 		});
// 	}

// 	await prisma.loanRepayment.createMany({
// 		data: repayments,
// 	} as any);
// }
