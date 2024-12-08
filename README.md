# React + TypeScript + Vite

    <Canvas shadows camera={{ position: [0, 25, 25] }}>
          {/* fog je nice, sam sele ko mas staticno kamero */}
          {/* <fog attach="fog" args={["black", 15, 21.5]} /> */}

          <OrbitControls />

          {/* <ambientLight intensity={Math.PI / 5} /> */}
          <hemisphereLight intensity={Math.PI / 2} />
          <directionalLight
            position={[20, 10, 10]}
            intensity={Math.PI / 2}
            castShadow
          />
          {/* <spotLight
            position={[0, 40, -10]}
            angle={28}
            penumbra={1}
            decay={2}
            intensity={Math.PI}
          /> */}
          {/* <pointLight
            position={[-10, -10, -10]}
            decay={0}
            intensity={Math.PI}
          /> */}
          {/* <Box position={[-1.2, 0, 0]} />
          <Box position={[1.2, 0, 0]} /> */}
          <Plane vertData={vertData} setVertData={setVertData} />
          <FloatingBox vertData={vertData} />
          {/* <Grid infiniteGrid /> */}
        </Canvas

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ["./tsconfig.node.json", "./tsconfig.app.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from "eslint-plugin-react";

export default tseslint.config({
  // Set the react version
  settings: { react: { version: "18.3" } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs["jsx-runtime"].rules,
  },
});
```
