import { auth } from "@/auth";
import { getCards } from "@/app/actions/finance-cards";
import prisma from "@/lib/prisma";
import CreditCardsClient from "./client";
import { redirect } from "next/navigation";

export default async function CreditCardsPage() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect("/financeiro/login");
    }

    // Fetch the FinanceUser to get the ID
    const user = await prisma.financeUser.findUnique({
        where: { email: session.user.email }
    });

    if (!user) {
        return <div className="p-8 text-center text-red-500">Usuário financeiro não encontrado.</div>;
    }

    // Fetch cards using the id
    const cards = await getCards(user.id);

    return <CreditCardsClient cards={cards} userId={user.id} />;
}
