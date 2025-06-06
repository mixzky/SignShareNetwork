FROM denoland/deno:1.40.2

WORKDIR /app

# Copy the function code
COPY . .

# Cache the dependencies
RUN deno cache index.ts

# The port your function will run on
EXPOSE 54321

# Run the function
CMD ["run", "--allow-net", "--allow-env", "index.ts"] 