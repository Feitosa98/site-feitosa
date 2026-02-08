import { getFinanceUser } from "@/lib/finance-auth";
import { getCards } from "@/app/actions/finance-cards";
import CreditCardsClient from "./client";
import { redirect } from "next/navigation";

export default async function CreditCardsPage() {
    // Use the custom finance authentication instead of NextAuth
    const user = await getFinanceUser();

    if (!user) {
        redirect("/financeiro/login");
    }

    // Fetch cards using the id
    const cards = await getCards(user.id);

    return <CreditCardsClient cards={cards} userId={user.id} />;
}
