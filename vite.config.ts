import { defineConfig } from "vite"
import path from "path"
import react from "@vitejs/plugin-react-swc"

export default defineConfig({
	plugins: [react()],
	build: {
		rollupOptions: {
			input: {
				main: path.resolve(__dirname, "index.html"),
				sw: path.resolve(__dirname, "src/sw.ts"),
			},
			output: {
				entryFileNames: "assets/[name].js",
				chunkFileNames: "assets/[name].js",
				assetFileNames: "assets/[name].[ext]",
			}
		}
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
})
