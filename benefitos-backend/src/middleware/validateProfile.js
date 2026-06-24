module.exports = (req, res, next) => {
  const { age, income, name, state, stage } = req.body;
  const parsedAge = Number(age);
  const parsedIncome = Number(income);

  const validAge =
    Number.isInteger(parsedAge) && parsedAge >= 0 && parsedAge <= 120;
  const validIncome = Number.isInteger(parsedIncome) && parsedIncome >= 0;
  const validText = [name, state, stage].every(
    (value) => typeof value === "string" && value.trim().length > 0,
  );

  if (!validAge || !validIncome || !validText) {
    return res.status(400).json({ error: "Validation failed" });
  }

  req.body.age = parsedAge;
  req.body.income = parsedIncome;
  req.body.name = name.trim();
  req.body.state = state.trim();
  req.body.stage = stage.trim();

  next();
};
