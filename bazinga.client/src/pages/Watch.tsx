import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getTrailer } from "@/data/trailers";

const Watch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const trailer = id ? getTrailer(id) : undefined;

  if (!trailer) {
    return (
      <div className="fixed inset-0 z-[90] grid place-items-center bg-black text-white">
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold">Trailer not found.</p>
          <button
            type="button"
            onClick={() => navigate("/bazinga-tv")}
            className="text-orange-500 hover:text-orange-400 underline"
          >
            Back to BazingaTV
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] bg-black">
      <video
        key={trailer.id}
        src={trailer.src}
        className="h-full w-full object-contain bg-black"
        autoPlay
        controls
        playsInline
      />

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-white hover:bg-black/80 transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="font-semibold">Back</span>
      </button>

      <div className="absolute top-5 right-5 z-10 pointer-events-none">
        <span className="text-sm md:text-base font-black uppercase tracking-tight text-white/90 drop-shadow">
          {trailer.title}
        </span>
      </div>
    </div>
  );
};

export default Watch;
