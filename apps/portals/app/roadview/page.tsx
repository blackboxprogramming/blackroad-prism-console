import { Card } from "../../components/ui/card";

interface Video {
  title: string;
  description: string;
  url: string;
}

const videos: Video[] = [
  {
    title: "Welcome to RoadView",
    description: "Introductory clip about the RoadView portal.",
    url: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  {
    title: "Road Infrastructure Update",
    description: "A short look at the latest RoadChain upgrade.",
    url: "https://www.w3schools.com/html/movie.mp4",
  },
];

export default function RoadViewPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">RoadView</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {videos.map((video) => (
          <Card key={video.title} className="p-4">
            <div
              className="mb-2 w-full overflow-hidden rounded bg-black"
              style={{ aspectRatio: "16 / 9" }}
            >
              <video className="h-full w-full" controls src={video.url} />
            </div>
            <h2 className="text-lg font-semibold">{video.title}</h2>
            <p className="text-sm text-gray-400">{video.description}</p>
          </Card>
        ))}
      </div>
    </main>
  );
}
