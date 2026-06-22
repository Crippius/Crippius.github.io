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
          <span>Milan, Italy</span>
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

    <p>
      I'm a High Performance Computing Engineering student @ Politecnico di Milano & University of Luxembourg.
    </p>

    <h3>I'm interested in</h3>
    <ul>
      <li>Understanding how the biggest supercomputers on Earth work</li>
      <li>Learning about the latest discoveries in Artificial Intelligence</li>
      <li>Working with big data to solve complex real-world problems</li>
    </ul>

    <h3>Master's Thesis</h3>
    <p>
      Currently completing my thesis at <strong>MEGWARE</strong> on <em>Automated Performance Analysis and Bottleneck Detection for HPC Applications</em>, building a heuristic and ML pipeline that monitors ~100 HPC metrics in real time and delivers interpretable optimization recommendations without requiring source-code access.
    </p>

    <a href="{{ site.author.cv_url }}" class="btn btn-primary" target="_blank">
      <i class="fas fa-file-pdf"></i> Download CV
    </a>

  </div>
</div>
