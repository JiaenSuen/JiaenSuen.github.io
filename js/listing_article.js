
document.addEventListener("DOMContentLoaded", async () => {
    const articleList = document.getElementById("article-list");
    const response = await fetch("./data/blog_data.json");

    const articles = await response.json();

    articles.forEach(article => {
        const articleElement = document.createElement("div");
        articleElement.classList.add("article");
    
        articleElement.innerHTML = `
            <div class="article-content">
                <a href="${article.link}">
                <h3>${article.title}</h3></a>
                <p>${article.description}</p>
                
            </div>
            <div class="article-image">
                
                    <img src="${article.image}" alt="${article.title}">
                
            </div>
        `;
    
        articleList.appendChild(articleElement);
    });
    
});
