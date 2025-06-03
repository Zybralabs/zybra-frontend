import * as CSS from "csstype";
import * as React from "react";
import styled from "styled-components";
import {
 type ColorProps,
 type ResponsiveValue,
 type TypographyProps as TypographySystemProps,
 color,
 compose,
 system,
 typography as typographySystem,
} from "styled-system";

interface TypographyProps {
 textTransform?: ResponsiveValue<CSS.Property.TextTransform>;
 whiteSpace?: ResponsiveValue<CSS.Property.WhiteSpace>;
 textDecoration?: ResponsiveValue<CSS.Property.TextDecoration>;
 customFontFamily?: string;
}

const typography = system({
 textTransform: true,
 whiteSpace: true,
 textDecoration: true,
 customFontFamily: {
   property: 'fontFamily'
 }
});

interface SystemProps extends TypographySystemProps, ColorProps, TypographyProps {}

interface StyledTextProps extends SystemProps {
 children?: React.ReactNode;
 color?: string;
 fontSize?: string;
}

const StyledText = styled.span.withConfig({
 shouldForwardProp: (prop) => !['textOverflow'].includes(prop),
})<StyledTextProps>(
 ({ color: textColor }) => ({
   margin: 0,
   color: textColor === "textPrimary" ? "#FFFFFF" : 
          textColor === "textSecondary" ? "rgba(255, 255, 255, 0.7)" :
          textColor === "textTertiary" ? "rgba(255, 255, 255, 0.5)" :
          textColor
 }),
 compose(typographySystem, typography, color)
);

type TextProps = React.ComponentProps<any> & {
 textOverflow?: "ellipsis";
 as?: React.ElementType;
};

const Text = React.forwardRef<HTMLSpanElement, TextProps>((props, ref) => {
 const {
   children,
   as = "span",
   color = "textPrimary", 
   fontSize = "1rem",
   customFontFamily = "standard",
   lineHeight = 1.5,
   fontFamily = "standard",
   textOverflow,
   ...rest
 } = props;

 const overflow = textOverflow ? {
   overflow: "hidden",
   textOverflow
 } : {};

 return (
   <StyledText
     as={as}
     color={color}
     fontSize={fontSize}
     fontFamily={customFontFamily} 
     lineHeight={lineHeight}
     style={overflow}
     ref={ref}
     {...rest}
   >
     {children}
   </StyledText>
 );
});

Text.displayName = "Text";

export type { TextProps };
export { Text };