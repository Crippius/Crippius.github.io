---
layout: page
title: About Me
---

<div class="about-section">
  <div class="about-sidebar">
    <div class="about-image">
      <img src="{{ site.author.avatar }}" alt="{{ site.author.name }}">
    </div>
    
    <div class="about-contact-info">
      <h3>Contact</h3>
      <ul class="contact-list">
        <li>
          <i class="fas fa-envelope"></i>
          <a href="mailto:{{ site.author.email }}">{{ site.author.email }}</a>
        </li>
        <li>
          <i class="fas fa-map-marker-alt"></i>
          <span>Milan, Italy / Luxembourg</span>
        </li>
        <li>
          <i class="fab fa-linkedin"></i>
          <a href="https://linkedin.com/in/{{ site.author.linkedin }}" target="_blank">LinkedIn</a>
        </li>
        <li>
          <i class="fab fa-github"></i>
          <a href="https://github.com/{{ site.author.github }}" target="_blank">GitHub</a>
        </li>
      </ul>
    </div>
  </div>
  
  <div class="about-content">
    <h2>Hello! I'm {{ site.author.name }}</h2>
    <p class="lead">{{ site.author.tagline }}</p>

    <p>
      I'm a High Performance Computing Engineering student @ Politecnico di Milano & University of Luxembourg.
    </p>

    <h3>I'm interested in</h3>
    <ul>
      <li>Understanding how the biggest supercomputers on Earth work</li>
      <li>Learning about the latest discoveries in Artificial Intelligence</li>
      <li>Working with big data to solve complex real-world problems</li>
    </ul>

    <p>
      Currently, I'm working on my master's thesis focusing on [REDACTED]. (Can't disclose more details yet!)
    </p>

  </div>
</div>
