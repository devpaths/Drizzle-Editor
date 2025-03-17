import DrizzleEditor from "@/components/editor/DrizzleEditor";
import { ThemeProvider } from "@/components/theme-provider";
import "@/styles/globals.css";
export default function Home() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <DrizzleEditor />
    </ThemeProvider>
  );
}
// import { ThemeProvider } from "@/components/theme-provider";
// interface RootLayoutProps {
//   children: React.ReactNode;
// }
// export default function RootLayout({ children }: RootLayoutProps) {
//   return (
//     <>
//       <html lang="en" suppressHydrationWarning>
//         <head />
//         <body>
//           <ThemeProvider
//             attribute="class"
//             defaultTheme="system"
//             enableSystem
//             disableTransitionOnChange
//           >
//             {children}
//           </ThemeProvider>
//         </body>
//       </html>
//     </>
//   );
// }
// //
