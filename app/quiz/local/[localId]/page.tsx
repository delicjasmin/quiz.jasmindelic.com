import { GuestLocalQuizPlayer } from "./GuestLocalQuizPlayer";

type GuestQuizPageProps = {
  params: Promise<{ localId: string }>;
};

export default async function GuestQuizPage({ params }: GuestQuizPageProps) {
  const { localId } = await params;

  return <GuestLocalQuizPlayer localId={localId} />;
}
