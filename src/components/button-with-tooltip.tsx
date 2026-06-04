import React, { forwardRef } from "react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ButtonWithTooltipProps {
  children: React.ReactElement;
  side: "top" | "bottom" | "left" | "right";
  toolTipText: string;
}

const ButtonWithTooltip = forwardRef<HTMLButtonElement, ButtonWithTooltipProps>(
  ({ children, side, toolTipText }, ref) => {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger ref={ref} render={children} />
          <TooltipContent side={side}>
            <div>{toolTipText}</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

ButtonWithTooltip.displayName = "ButtonWithTooltip";

export default ButtonWithTooltip;
