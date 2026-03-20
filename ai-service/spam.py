from transformers import AutoTokenizer, AutoModelForSequenceClassification

model_name = "Goodmotion/spam-mail-classifier"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(
    model_name
)

text = "Félicitations ! Vous avez gagné un iPhone."
inputs = tokenizer(text, return_tensors="pt")
outputs = model(**inputs)
print(outputs.logits)
