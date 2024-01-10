const loadBlogPosts = async () => {
    const res = await fetch("https://griffa.dev/feed/feed.json");
    const feed = await res.json();
    return feed.items.map((item) => {
      return {
        /* search on title and summary */
        searchData: `${item.title} ${item.summary}`,
        title: item.title,
        description: item.summary,
      };
    });
  };

// multiply with value with corresponding value in the other array at the same index, then sum.
const dotProduct = (vector1, vector2) => {
    return vector1.reduce((product, current, index) => {
      product += current * vector2[index];
      return product;
    }, 0);
  };
  
  // square each value in the array and add them all up, then square root.
  const vectorMagnitude = (vector) => {
    return Math.sqrt(
      vector.reduce((sum, current) => {
        sum += current * current;
        return sum;
      }, 0)
    );
  };
  
  const cosineSimilarity = (vector1, vector2) => {
    return (
      dotProduct(vector1, vector2) /
      (vectorMagnitude(vector1) * vectorMagnitude(vector2))
    );
  };

// IIFE - because no top level await in all browsers at time of writing.
((async () => {
    // download the model
    // const model = await use.load();
    // const blogPosts = [
    //   "How I got started with 11ty",
    //   "Building a responsive, progressively enhanced, masonry layout with only CSS and HTML",
    //   "Using the Web Share API and meta tags, for simple native sharing",
    //   "Tips for debugging in 11ty",
    // ];

    const [model, blogPosts] = await Promise.all([use.load(), loadBlogPosts()]);

    const userQuery = "Sharing to social media";
    // embed the user input and the blog posts using the model -  explained next!
    // const blogPostsTensor = await model.embed(blogPosts);

    const blogPostsTensor = await model.embed(
        blogPosts.map(({ searchData }) => searchData)
      );
      
    // wrap the user input in an array so model can work with it
    const userInputTensor = await model.embed([userQuery]);
  
    // == New code starts here //
    // convert to JS arrays from the tensors
    const inputVector = await userInputTensor.array();
    const dataVector = await blogPostsTensor.array();
  
    // this is an array of arrays, we only care about one piece of user input, one search query so
    const userQueryVector = inputVector[0];
  
    // how many results do i want to show
    const MAX_RESULTS = 2;
    // loop through the blog  post data
    const predictions = dataVector
      .map((dataEntry, dataEntryIndex) => {
        // COSINE SIMILARITY - compare the user input tensor with each blog post.
        const similarity = cosineSimilarity(userQueryVector, dataEntry);
        return {
          similarity,
          result: blogPosts[dataEntryIndex],
        };
        // sort descending
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, MAX_RESULTS);
  
    document.querySelector("#initial-example-results").innerText = JSON.stringify(
      predictions,
      null,
      2
    );
  })();