import { cn } from "@/lib/utils";
import {
  FaFacebook,
  FaGithub,
  FaLinkedin,
  FaSlack,
  FaYoutube,
} from "react-icons/fa";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface Props {
  className?: string;
  iconClassName?: string;
  tooltipClassName?: string;
}

const socialLink = [
  {
    title: "Youtube",
    href: "https://www.youtube.com",
    icon: <FaYoutube className="h-5 w-5" />,
  },
  {
    title: "Github",
    href: "https://www.youtube.com",
    icon: <FaGithub className="h-5 w-5" />,
  },
  {
    title: "Linkedin",
    href: "https://www.youtube.com",
    icon: <FaLinkedin className="h-5 w-5" />,
  },
  {
    title: "Facebook",
    href: "https://www.youtube.com",
    icon: <FaFacebook className="h-5 w-5" />,
  },
  {
    title: "Slack",
    href: "https://www.youtube.com",
    icon: <FaSlack className="h-5 w-5" />,
  },
];

const SocialMedia = ({ className, iconClassName, tooltipClassName }: Props) => {
  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-3.5 text-zinc-400", className)}>
        {socialLink.map((item) => (
          <Tooltip key={item.title}>
            <TooltipTrigger
              render={
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "hoverEffect hover:border-shop_light_green inline-flex items-center justify-center rounded-full border bg-transparent p-2 text-current hover:text-white",
                    iconClassName,
                  )}
                />
              }
            >
              {item.icon}
            </TooltipTrigger>
            <TooltipContent
              className={cn(
                "text-dark-color bg-white font-semibold [&>div]:bg-white",
                tooltipClassName,
              )}
            >
              {item.title}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default SocialMedia;
