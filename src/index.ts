import app from "./App.js";

const port = process.env.PORT || 3100;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
