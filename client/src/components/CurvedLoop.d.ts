declare module "@/components/CurvedLoop" {
  interface CurvedLoopProps {
    marqueeText?: string;
    speed?: number;
    className?: string;
    curveAmount?: number;
    direction?: "left" | "right";
    interactive?: boolean;
  }

  export default function CurvedLoop(props: CurvedLoopProps): JSX.Element;
}

