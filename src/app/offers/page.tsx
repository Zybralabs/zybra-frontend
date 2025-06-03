import { OfferInterface } from "@/components/MainOffer";

export default async function Offers() {
  return (
    <div className="flex container justify-center h-full">
      <div className="flex flex-col flex-1">
        <OfferInterface />
      </div>
    </div>
  );
}
