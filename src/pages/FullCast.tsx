import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import BackButton from "../components/BackButton";
import { useScrollRestoration } from "../hooks/useScrollRestoration";
import { getMovieDetails } from "../api/movies";
import { CastMember, CrewMember } from "../types";

type MovieBasic = {
  id: number;
  title: string;
  credits: {
    cast: CastMember[];
    crew: CrewMember[];
  };
};

const DEPARTMENTS = [
  "Directing",
  "Writing",
  "Production",
  "Camera",
  "Editing",
  "Art",
  "Sound",
  "Costume & Make-Up",
  "Visual Effects",
  "Lighting",
  "Crew",
];

export default function FullCast() {
  const { id } = useParams();
  const [movie, setMovie]     = useState<MovieBasic | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"cast" | "crew">("cast");

  useScrollRestoration();

  useEffect(() => {
    setLoading(true);
    getMovieDetails(Number(id))
      .then((res) => setMovie(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      <div className="h-6 bg-gray-800 rounded animate-pulse w-32" />
      <div className="h-8 bg-gray-800 rounded animate-pulse w-64" />
      <div className="flex gap-2">
        <div className="h-9 w-24 bg-gray-800 rounded-full animate-pulse" />
        <div className="h-9 w-24 bg-gray-800 rounded-full animate-pulse" />
      </div>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />
      ))}
    </div>
  );

  if (!movie) return (
    <div className="text-gray-400 text-center py-20">Not found.</div>
  );

  // Group crew by department
  const crewByDepartment: Record<string, CrewMember[]> = {};
  movie.credits.crew.forEach((member) => {
    const dept = member.department || "Other";
    if (!crewByDepartment[dept]) crewByDepartment[dept] = [];
    const exists = crewByDepartment[dept].some(
      (m) => m.id === member.id && m.job === member.job
    );
    if (!exists) crewByDepartment[dept].push(member);
  });

  const orderedDepts = [
    ...DEPARTMENTS.filter((d) => crewByDepartment[d]),
    ...Object.keys(crewByDepartment).filter((d) => !DEPARTMENTS.includes(d)),
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div>
        <BackButton to={`/movie/${id}`} label={`Back to ${movie.title}`} />
        <h1 className="text-white text-2xl font-bold">{movie.title}</h1>
        <p className="text-gray-400 text-sm mt-1">Full Cast & Crew</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("cast")}
          className={`px-5 py-2 rounded-full text-sm font-medium transition ${
            activeTab === "cast"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Cast
          <span className="ml-1.5 text-xs opacity-70">
            {movie.credits.cast.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("crew")}
          className={`px-5 py-2 rounded-full text-sm font-medium transition ${
            activeTab === "crew"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Crew
          <span className="ml-1.5 text-xs opacity-70">
            {movie.credits.crew.length}
          </span>
        </button>
      </div>

      {/* Cast Tab */}
      {activeTab === "cast" && (
        <div className="space-y-2">
          {movie.credits.cast.map((member) => (
            <Link to={`/person/${member.id}`} key={member.id}>
              <div className="flex items-center gap-4 bg-gray-900 hover:bg-gray-800 rounded-xl px-4 py-3 transition">
                {member.profile_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w45${member.profile_path}`}
                    alt={member.name}
                    className="w-10 h-10 rounded-full object-cover object-top shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-500 text-xs shrink-0">
                    ?
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">
                    {member.name}
                  </p>
                  <p className="text-gray-500 text-xs truncate">
                    {member.character}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Crew Tab */}
      {activeTab === "crew" && (
        <div className="space-y-8">
          {orderedDepts.map((dept) => (
            <div key={dept}>
              <h2 className="text-white font-bold text-lg mb-3 border-b border-gray-800 pb-2">
                {dept}
              </h2>
              <div className="space-y-2">
                {crewByDepartment[dept].map((member, i) => (
                  <Link
                    to={`/person/${member.id}`}
                    key={`${member.id}-${member.job}-${i}`}
                  >
                    <div className="flex items-center gap-4 bg-gray-900 hover:bg-gray-800 rounded-xl px-4 py-3 transition">
                      {member.profile_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w45${member.profile_path}`}
                          alt={member.name}
                          className="w-10 h-10 rounded-full object-cover object-top shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-500 text-xs shrink-0">
                          ?
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">
                          {member.name}
                        </p>
                        <p className="text-gray-500 text-xs truncate">
                          {member.job}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
