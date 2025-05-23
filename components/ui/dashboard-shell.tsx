"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRole } from "@prisma/client";
import {
	BarChart3,
	CreditCard,
	FileText,
	Home,
	LogOut,
	Menu,
	PieChart,
	Settings,
	Users,
	X,
	UserPlus,
	CheckCircle,
	DollarSign,
	FileSearch,
	History,
	Calculator,
	Upload,
	ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-provider";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
	children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
	const { user, logout } = useAuth();
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);

	const toggleSidebar = () => {
		setIsOpen(!isOpen);
	};

	const closeSidebar = () => {
		setIsOpen(false);
	};

	const navItems = [
		{
			title: "Dashboard",
			href: "/dashboard",
			icon: Home,
			roles: [
				UserRole.LOAN_OFFICER,
				UserRole.BRANCH_MANAGER,
				UserRole.REGIONAL_MANAGER,
				UserRole.FINANCE_ADMIN,
			],
		},
		{
			title: "Members",
			href: "/dashboard/members",
			icon: Users,
			roles: [
				UserRole.LOAN_OFFICER,
				UserRole.BRANCH_MANAGER,
				UserRole.REGIONAL_MANAGER,
				UserRole.FINANCE_ADMIN,
			],
		},
		{
			title: "Add Member",
			href: "/dashboard/members/add",
			icon: UserPlus,
			roles: [
				UserRole.LOAN_OFFICER,
				UserRole.BRANCH_MANAGER,
				UserRole.REGIONAL_MANAGER,
				UserRole.FINANCE_ADMIN,
			],
		},
		{
			title: "Loans",
			href: "/dashboard/loans/details",
			icon: CreditCard,
			roles: [
				UserRole.LOAN_OFFICER,
				UserRole.BRANCH_MANAGER,
				UserRole.REGIONAL_MANAGER,
				UserRole.FINANCE_ADMIN,
			],
		},
		// {
		// 	title: "Manage Loans",
		// 	href: "/dashboard/loans/manage",
		// 	icon: CreditCard,
		// 	roles: [
		// 		UserRole.LOAN_OFFICER,
		// 		UserRole.BRANCH_MANAGER,
		// 		UserRole.REGIONAL_MANAGER,
		// 		UserRole.FINANCE_ADMIN,
		// 	],
		// },
		// {
		// 	title: "Loan Details",
		// 	href: "/dashboard/loans/details",
		// 	icon: FileSearch,
		// 	roles: [
		// 		UserRole.LOAN_OFFICER,
		// 		UserRole.BRANCH_MANAGER,
		// 		UserRole.REGIONAL_MANAGER,
		// 		UserRole.FINANCE_ADMIN,
		// 	],
		// },
		{
			title: "Disburse Loans",
			href: "/dashboard/loans/disburse",
			icon: DollarSign,
			roles: [UserRole.FINANCE_ADMIN],
		},

		{
			title: "Approval History",
			href: "/dashboard/loans/approval-history",
			icon: History,
			roles: [
				UserRole.LOAN_OFFICER,
				UserRole.BRANCH_MANAGER,
				UserRole.REGIONAL_MANAGER,
				UserRole.FINANCE_ADMIN,
			],
		},
		{
			title: "Verify Loans",
			href: "/dashboard/loans/verify",
			icon: CheckCircle,
			roles: [UserRole.LOAN_OFFICER],
		},
		// {
		// 	title: "Approve Loans",
		// 	href: "/dashboard/loans/approve",
		// 	icon: FileText,
		// 	roles: [UserRole.BRANCH_MANAGER, UserRole.REGIONAL_MANAGER],
		// },

		{
			title: "Loan Calculator",
			href: "/dashboard/loans/calculator",
			icon: Calculator,
			roles: [
				UserRole.LOAN_OFFICER,
				UserRole.BRANCH_MANAGER,
				UserRole.REGIONAL_MANAGER,
				UserRole.FINANCE_ADMIN,
			],
		},
		{
			title: "Loan Documents",
			href: "/dashboard/loans/documents",
			icon: Upload,
			roles: [
				UserRole.LOAN_OFFICER,
				UserRole.BRANCH_MANAGER,
				UserRole.REGIONAL_MANAGER,
				UserRole.FINANCE_ADMIN,
			],
		},
		{
			title: "Loan Approval Dashboard",
			href: "/dashboard/loans/approval-dashboard",
			icon: ClipboardList,
			roles: [
				UserRole.LOAN_OFFICER,
				UserRole.BRANCH_MANAGER,
				UserRole.REGIONAL_MANAGER,
				UserRole.FINANCE_ADMIN,
			],
		},
		{
			title: "Membership Requests",
			href: "/dashboard/membership-requests",
			icon: Users,
			roles: [
				UserRole.LOAN_OFFICER,
				UserRole.BRANCH_MANAGER,
				UserRole.REGIONAL_MANAGER,
				UserRole.FINANCE_ADMIN,
			],
		},
		{
			title: "Reports",
			href: "/dashboard/reports",
			icon: BarChart3,
			roles: [
				UserRole.LOAN_OFFICER,
				UserRole.BRANCH_MANAGER,
				UserRole.REGIONAL_MANAGER,
				UserRole.FINANCE_ADMIN,
			],
		},
		{
			title: "Analytics",
			href: "/dashboard/analytics",
			icon: PieChart,
			roles: [
				UserRole.BRANCH_MANAGER,
				UserRole.REGIONAL_MANAGER,
				UserRole.FINANCE_ADMIN,
			],
		},
		{
			title: "Settings",
			href: "/dashboard/settings",
			icon: Settings,
			roles: [UserRole.FINANCE_ADMIN],
		},
	];

	const filteredNavItems = navItems.filter(
		(item) => user && item.roles.includes(user.role as UserRole | any)
	);

	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth >= 768) {
				setIsOpen(false);
			}
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return (
		<div className="flex min-h-screen flex-col bg-gray-100">
			{/* Mobile Header */}
			<header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 md:hidden">
				<Button variant="ghost" size="icon" onClick={toggleSidebar}>
					<Menu className="h-6 w-6" />
					<span className="sr-only">Toggle Menu</span>
				</Button>
				<div className="font-semibold">Microfinance Admin</div>
				<div className="w-6"></div> {/* Spacer for alignment */}
			</header>

			{/* Mobile Sidebar Overlay */}
			{isOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/50 md:hidden"
					onClick={closeSidebar}></div>
			)}

			{/* Sidebar */}
			<aside
				className={cn(
					"fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-white transition-transform duration-200 ease-in-out md:translate-x-0",
					isOpen ? "translate-x-0" : "-translate-x-full"
				)}>
				<div className="flex h-16 items-center justify-between border-b px-4">
					<div className="font-semibold">Microfinance Admin</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={closeSidebar}
						className="md:hidden">
						<X className="h-5 w-5" />
						<span className="sr-only">Close Menu</span>
					</Button>
				</div>
				<div className="flex flex-col h-[calc(100vh-4rem)]">
					<div className="flex-1 overflow-y-auto py-2">
						<nav className="grid gap-1 px-2">
							{filteredNavItems.map((item, index) => (
								<Link
									key={index}
									href={item.href}
									onClick={closeSidebar}
									className={cn(
										"flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ease-in-out hover:bg-gray-100",
										pathname === item.href
											? "bg-blue-100 text-blue-600"
											: "text-gray-700"
									)}>
									<item.icon className="h-5 w-5" />
									{item.title}
								</Link>
							))}
						</nav>
					</div>
					<div className="border-t p-4">
						<div className="mb-2 flex items-center gap-2">
							<div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
								<span className="text-lg font-medium text-blue-700">
									{user?.name.charAt(0)}
								</span>
							</div>
							<div>
								<p className="text-sm font-medium">{user?.name}</p>
								<p className="text-xs text-gray-500">
									{user?.role.replace("_", " ")}
								</p>
							</div>
						</div>
						<Button
							variant="outline"
							size="sm"
							className="w-full justify-start"
							onClick={() => logout()}>
							<LogOut className="mr-2 h-4 w-4" />
							Log out
						</Button>
					</div>
				</div>
			</aside>

			{/* Main Content */}
			<main
				className={cn(
					"flex-1 transition-all duration-200 ease-in-out",
					"md:ml-64" // Always pushed on desktop
				)}>
				<div className="container mx-auto p-4 md:p-6">{children}</div>
			</main>
		</div>
	);
}
