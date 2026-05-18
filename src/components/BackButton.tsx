import { useNavigate } from "react-router-dom";

interface Props {
  to?: string;   // optional fixed path, otherwise goes back in history
  label?: string;
}

export default function BackButton({ to, label = "Back" }: Props) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) navigate(to);
    else navigate(-1);
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm font-medium transition"
    >
      <span className="text-base leading-none">←</span>
      {label}
    </button>
  );
}
